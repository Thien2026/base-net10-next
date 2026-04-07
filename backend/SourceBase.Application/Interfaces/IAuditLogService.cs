using System.Threading.Tasks;
using SourceBase.Application.DTOs;
using SourceBase.Application.DTOs.AuditLogs;

namespace SourceBase.Application.Interfaces
{
    public interface IAuditLogService
    {
        Task LogAsync(string action, string target, string? detail = null);
        Task<PagedResponse<System.Collections.Generic.IEnumerable<AuditLogDto>>> GetLogsAsync(int pageNumber = 1, int pageSize = 50, string? userId = null, string? action = null);
    }
}
