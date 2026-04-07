using SourceBase.Application.DTOs;
using SourceBase.Application.DTOs.Files;
using System.IO;

namespace SourceBase.Application.Interfaces
{
    public interface IFileStorageService
    {
        Task<PagedResponse<IEnumerable<FileItemDto>>> GetItemsAsync(string path, int pageNumber = 1, int pageSize = 50);
        Task<FileItemDto> GetFolderTreeAsync();
        Task UploadFilesAsync(string path, IEnumerable<FileUploadDto> files);
        Task CreateFolderAsync(string path, string folderName);
        Task RenameItemAsync(string oldPath, string newName);
        Task MoveItemsAsync(List<string> sourcePaths, string destinationFolder);
        Task DeleteItemsAsync(List<string> paths);
        Task<(Stream Stream, string ContentType, string FileName)> DownloadItemAsync(string path);
        Task<(Stream Stream, string ContentType, string FileName)> CreateZipAsync(List<string> paths);
        Task<StorageStatsDto> GetStorageStatsAsync();
        Task<string> UploadAvatarAsync(Stream fileStream, string fileName, string? oldAvatarUrl);
    }
}

