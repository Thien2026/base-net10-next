using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SourceBase.Application.DTOs.Files;
using SourceBase.Application.Interfaces;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace SourceBase.API.Controllers
{
    [Authorize]
    [Route("api/v1/files")]
    [ApiController]
    public class FileController : ControllerBase
    {
        private readonly IFileStorageService _fileStorageService;
        private readonly IAuditLogService _auditLogService;

        public FileController(IFileStorageService fileStorageService, IAuditLogService auditLogService)
        {
            _fileStorageService = fileStorageService;
            _auditLogService = auditLogService;
        }

        [HttpGet("stats")]
        [Authorize(Roles = "Admin")] // Require Admin role to view storage stats
        public async Task<IActionResult> GetStorageStats()
        {
            var stats = await _fileStorageService.GetStorageStatsAsync();
            return Ok(stats);
        }

        [HttpGet("tree")]
        public async Task<IActionResult> GetFolderTree()
        {
            var tree = await _fileStorageService.GetFolderTreeAsync();
            return Ok(tree);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetItems([FromQuery] string path = "", [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50)
        {
            var items = await _fileStorageService.GetItemsAsync(path, pageNumber, pageSize);
            return Ok(items);
        }

        [HttpPost("upload")]
        [RequestSizeLimit(long.MaxValue)]
        [RequestFormLimits(MultipartBodyLengthLimit = long.MaxValue)]
        public async Task<IActionResult> UploadFiles([FromForm] string? path)
        {
            var files = Request.Form.Files;
            if (files == null || files.Count == 0)
                return BadRequest("No files uploaded.");

            var fileUploadDtos = new List<FileUploadDto>();
            
            // Collect the relativePaths array if sent
            var relativePaths = Request.Form.ContainsKey("relativePaths") 
                ? Request.Form["relativePaths"].ToArray() 
                : new string[0];

            int i = 0;
            foreach (var formFile in files)
            {
                var relativePath = relativePaths.Length > i ? relativePaths[i] : formFile.FileName;

                fileUploadDtos.Add(new FileUploadDto
                {
                    Content = formFile.OpenReadStream(),
                    FileName = formFile.FileName,
                    RelativePath = relativePath
                });
                i++;
            }

            await _fileStorageService.UploadFilesAsync(path ?? "", fileUploadDtos);
            await _auditLogService.LogAsync("upload", path ?? "/", $"Uploaded {files.Count} files");
            return Ok(new { message = "Files uploaded successfully." });
        }

        [HttpPost("folder")]
        public async Task<IActionResult> CreateFolder([FromBody] CreateFolderRequestDto request)
        {
            await _fileStorageService.CreateFolderAsync(request.Path ?? "", request.FolderName);
            await _auditLogService.LogAsync("create_folder", $"{request.Path ?? ""}/{request.FolderName}");
            return Ok(new { message = "Folder created." });
        }

        [HttpPut("rename")]
        public async Task<IActionResult> Rename([FromBody] RenameRequestDto request)
        {
            await _fileStorageService.RenameItemAsync(request.Path, request.NewName);
            await _auditLogService.LogAsync("rename", request.Path, $"Renamed to {request.NewName}");
            return Ok(new { message = "Renamed successfully." });
        }

        [HttpPut("move")]
        public async Task<IActionResult> Move([FromBody] MoveRequestDto request)
        {
            await _fileStorageService.MoveItemsAsync(request.Paths, request.DestinationFolder);
            await _auditLogService.LogAsync("move", string.Join(", ", request.Paths), $"Moved to {request.DestinationFolder}");
            return Ok(new { message = "Moved successfully." });
        }

        [HttpPost("delete")]
        public async Task<IActionResult> Delete([FromBody] DeleteRequestDto request)
        {
            await _fileStorageService.DeleteItemsAsync(request.Paths);
            await _auditLogService.LogAsync("delete", string.Join(", ", request.Paths));
            return Ok(new { message = "Deleted successfully." });
        }

        [HttpGet("download")]
        public async Task<IActionResult> Download([FromQuery] string path)
        {
            var (stream, contentType, fileName) = await _fileStorageService.DownloadItemAsync(path);
            return File(stream, contentType, fileName);
        }

        [HttpPost("download-zip")]
        public async Task<IActionResult> DownloadZip([FromBody] DeleteRequestDto request) 
        {
            // Re-using DeleteRequestDto since it just needs a List<string> Paths
            var (stream, contentType, fileName) = await _fileStorageService.CreateZipAsync(request.Paths);
            return File(stream, contentType, fileName);
        }

        [HttpGet("view")]
        public async Task<IActionResult> ViewFile([FromQuery] string path)
        {
            var (stream, contentType, _) = await _fileStorageService.DownloadItemAsync(path);
            
            // For images, viewing inline instead of downloading
            Response.Headers.Add("Content-Disposition", "inline");
            
            return File(stream, contentType);
        }
    }
}
