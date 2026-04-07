using Microsoft.Extensions.Configuration;
using SourceBase.Application.DTOs;
using SourceBase.Application.DTOs.Files;
using SourceBase.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Threading.Tasks;

namespace SourceBase.Infrastructure.Services
{
    public class FileStorageService : IFileStorageService
    {
        private readonly string _basePath;

        public FileStorageService(IConfiguration configuration)
        {
            var folder = configuration["FileStorage:UploadFolder"] ?? "uploads";
            // If the folder is absolute, use it directly, otherwise combine with current directory
            _basePath = Path.IsPathRooted(folder) 
                ? folder 
                : Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), folder));

            if (!Directory.Exists(_basePath))
            {
                Directory.CreateDirectory(_basePath);
            }
        }

        private string GetFullPath(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath) || relativePath == "/")
                return _basePath;

            var fullPath = Path.GetFullPath(Path.Combine(_basePath, relativePath.TrimStart('/', '\\')));
            
            // Path traversal security check
            if (!fullPath.StartsWith(_basePath, StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Access outside of the base directory is not allowed.");
            }
            return fullPath;
        }

        private string GetRelativePath(string fullPath)
        {
            if (fullPath.Length <= _basePath.Length)
                return "";
            return fullPath.Substring(_basePath.Length).TrimStart(Path.DirectorySeparatorChar).Replace("\\", "/");
        }

        public Task<PagedResponse<IEnumerable<FileItemDto>>> GetItemsAsync(string path, int pageNumber = 1, int pageSize = 50)
        {
            var targetPath = GetFullPath(path);
            if (!Directory.Exists(targetPath))
            {
                throw new DirectoryNotFoundException($"Directory not found: {path}");
            }

            var dirInfo = new DirectoryInfo(targetPath);
            
            // To prevent large memory spikes, we use EnumerateFileSystemInfos
            var allInfos = dirInfo.EnumerateFileSystemInfos();
            var totalRecords = allInfos.Count();

            // Paging and processing only the requested page
            var pagedInfos = allInfos
                .OrderByDescending(x => (x.Attributes & FileAttributes.Directory) == FileAttributes.Directory) // Folders first
                .ThenBy(x => x.Name)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize);

            var items = new List<FileItemDto>();

            foreach (var info in pagedInfos)
            {
                var isDir = (info.Attributes & FileAttributes.Directory) == FileAttributes.Directory;
                items.Add(new FileItemDto
                {
                    Name = info.Name,
                    Path = GetRelativePath(info.FullName),
                    IsDirectory = isDir,
                    LastModified = info.LastWriteTime,
                    Size = isDir ? 0 : ((FileInfo)info).Length,
                    Extension = isDir ? "" : info.Extension
                });
            }

            var response = new PagedResponse<IEnumerable<FileItemDto>>(items, pageNumber, pageSize, totalRecords);
            return Task.FromResult(response);
        }

        public Task<FileItemDto> GetFolderTreeAsync()
        {
            var rootDir = new DirectoryInfo(_basePath);
            var rootDto = BuildFolderTree(rootDir);
            // We want the root folder itself to appear as root
            rootDto.Name = "Root"; 
            rootDto.Path = "";
            return Task.FromResult(rootDto);
        }

        private FileItemDto BuildFolderTree(DirectoryInfo dir)
        {
            var dto = new FileItemDto
            {
                Name = dir.Name,
                Path = GetRelativePath(dir.FullName),
                IsDirectory = true,
                LastModified = dir.LastWriteTime,
                Size = 0,
                Children = new List<FileItemDto>()
            };

            foreach (var subDir in dir.GetDirectories())
            {
                dto.Children.Add(BuildFolderTree(subDir));
            }

            return dto;
        }

        public async Task UploadFilesAsync(string path, IEnumerable<FileUploadDto> files)
        {
            var targetBasePath = GetFullPath(path);

            foreach (var file in files)
            {
                var relativePath = file.RelativePath;
                if (string.IsNullOrWhiteSpace(relativePath))
                {
                    relativePath = file.FileName;
                }

                var fullFilePath = Path.GetFullPath(Path.Combine(targetBasePath, relativePath.TrimStart('/', '\\')));
                
                if (!fullFilePath.StartsWith(_basePath, StringComparison.OrdinalIgnoreCase))
                    continue; // Skip invalid paths

                var directory = Path.GetDirectoryName(fullFilePath);
                if (directory != null && !Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                using var fileStream = new FileStream(fullFilePath, FileMode.Create);
                await file.Content.CopyToAsync(fileStream);
            }
        }

        public Task CreateFolderAsync(string path, string folderName)
        {
            var targetPath = GetFullPath(path);
            var newFolderPath = Path.Combine(targetPath, folderName);
            
            if (!newFolderPath.StartsWith(_basePath, StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException("Access outside of the base directory is not allowed.");

            if (!Directory.Exists(newFolderPath))
            {
                Directory.CreateDirectory(newFolderPath);
            }
            else
            {
                throw new InvalidOperationException("Directory already exists.");
            }

            return Task.CompletedTask;
        }

        public Task RenameItemAsync(string oldPath, string newName)
        {
            var targetPath = GetFullPath(oldPath);
            
            if (File.Exists(targetPath))
            {
                var directory = Path.GetDirectoryName(targetPath);
                var newPath = Path.Combine(directory!, newName);
                File.Move(targetPath, newPath);
            }
            else if (Directory.Exists(targetPath))
            {
                var directory = Path.GetDirectoryName(targetPath); // Gets parent
                if (string.IsNullOrEmpty(directory))
                    throw new InvalidOperationException("Cannot rename root folder.");

                var newPath = Path.Combine(directory, newName);
                Directory.Move(targetPath, newPath);
            }
            else
            {
                throw new FileNotFoundException("Item not found");
            }

            return Task.CompletedTask;
        }

        public Task MoveItemsAsync(List<string> sourcePaths, string destinationFolder)
        {
            var destPath = GetFullPath(destinationFolder);

            if (!Directory.Exists(destPath))
            {
                Directory.CreateDirectory(destPath);
            }

            foreach (var sourcePath in sourcePaths)
            {
                var fullSourcePath = GetFullPath(sourcePath);
                var itemName = Path.GetFileName(fullSourcePath);
                var fullDestPath = Path.Combine(destPath, itemName);

                if (File.Exists(fullSourcePath))
                {
                    File.Move(fullSourcePath, fullDestPath, overwrite: false); // Or handle existing files
                }
                else if (Directory.Exists(fullSourcePath))
                {
                    Directory.Move(fullSourcePath, fullDestPath);
                }
            }

            return Task.CompletedTask;
        }

        public Task DeleteItemsAsync(List<string> paths)
        {
            foreach (var path in paths)
            {
                var targetPath = GetFullPath(path);
                if (File.Exists(targetPath))
                {
                    File.Delete(targetPath);
                }
                else if (Directory.Exists(targetPath))
                {
                    Directory.Delete(targetPath, recursive: true);
                }
            }

            return Task.CompletedTask;
        }

        private string GetMimeType(string fileName)
        {
            string ext = Path.GetExtension(fileName).ToLowerInvariant();
            return ext switch
            {
                ".txt" => "text/plain",
                ".csv" => "text/csv",
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".png" => "image/png",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".svg" => "image/svg+xml",
                ".webp" => "image/webp",
                ".zip" => "application/zip",
                ".mp4" => "video/mp4",
                _ => "application/octet-stream"
            };
        }

        public Task<(Stream Stream, string ContentType, string FileName)> DownloadItemAsync(string path)
        {
            var targetPath = GetFullPath(path);

            if (!File.Exists(targetPath))
            {
                throw new FileNotFoundException("File not found");
            }

            var stream = new FileStream(targetPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            var mimeType = GetMimeType(targetPath);
            var fileName = Path.GetFileName(targetPath);

            return Task.FromResult<(Stream, string, string)>((stream, mimeType, fileName));
        }

        public async Task<(Stream Stream, string ContentType, string FileName)> CreateZipAsync(List<string> paths)
        {
            var memoryStream = new MemoryStream();

            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
            {
                foreach (var path in paths)
                {
                    var fullPath = GetFullPath(path);
                    if (File.Exists(fullPath))
                    {
                        var entryName = Path.GetFileName(fullPath);
                        archive.CreateEntryFromFile(fullPath, entryName);
                    }
                    else if (Directory.Exists(fullPath))
                    {
                        var baseDir = Path.GetDirectoryName(fullPath) ?? _basePath;
                        AddDirectoryToZip(archive, fullPath, fullPath, "");
                    }
                }
            }

            memoryStream.Position = 0;
            return (memoryStream, "application/zip", $"Download_{DateTime.Now:yyyyMMdd_HHmmss}.zip");
        }

        private void AddDirectoryToZip(ZipArchive archive, string sourceDir, string rootDir, string currentEntryName)
        {
            var folderName = Path.GetFileName(sourceDir);
            var entryBase = string.IsNullOrEmpty(currentEntryName) ? folderName : $"{currentEntryName}/{folderName}";

            // Ensure empty folder is added
            var dirEntry = archive.CreateEntry($"{entryBase}/");

            foreach (var file in Directory.GetFiles(sourceDir))
            {
                archive.CreateEntryFromFile(file, $"{entryBase}/{Path.GetFileName(file)}");
            }

            foreach (var dir in Directory.GetDirectories(sourceDir))
            {
                AddDirectoryToZip(archive, dir, rootDir, entryBase);
            }
        }

        public Task<StorageStatsDto> GetStorageStatsAsync()
        {
            var stats = new StorageStatsDto();
            CalculateStats(_basePath, stats);
            return Task.FromResult(stats);
        }

        private static void CalculateStats(string directory, StorageStatsDto stats)
        {
            foreach (var file in Directory.EnumerateFiles(directory, "*", SearchOption.AllDirectories))
            {
                stats.TotalFiles++;
                stats.TotalSizeBytes += new FileInfo(file).Length;
            }
            // Count subdirectories (excluding root itself)
            stats.TotalFolders = Directory.EnumerateDirectories(directory, "*", SearchOption.AllDirectories).Count();
        }

        public async Task<string> UploadAvatarAsync(Stream fileStream, string fileName, string? oldAvatarUrl)
        {
            var avatarFolder = Path.Combine(_basePath, "avatars");
            if (!Directory.Exists(avatarFolder))
            {
                Directory.CreateDirectory(avatarFolder);
            }

            if (!string.IsNullOrEmpty(oldAvatarUrl))
            {
                var oldPath = Path.GetFullPath(Path.Combine(_basePath, oldAvatarUrl.TrimStart('/')));
                if (File.Exists(oldPath) && oldPath.StartsWith(_basePath))
                {
                    File.Delete(oldPath);
                }
            }

            var extension = Path.GetExtension(fileName);
            var newFileName = $"{Guid.NewGuid()}{extension}";
            var newFilePath = Path.Combine(avatarFolder, newFileName);

            using (var stream = new FileStream(newFilePath, FileMode.Create))
            {
                await fileStream.CopyToAsync(stream);
            }

            return $"/avatars/{newFileName}";
        }
    }
}

