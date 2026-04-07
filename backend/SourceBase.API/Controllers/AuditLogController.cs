using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SourceBase.Application.Interfaces;
using System.Threading.Tasks;

namespace SourceBase.API.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/v1/audit-logs")]
    [ApiController]
    public class AuditLogController : ControllerBase
    {
        private readonly IAuditLogService _auditLogService;

        public AuditLogController(IAuditLogService auditLogService)
        {
            _auditLogService = auditLogService;
        }

        [HttpGet]
        public async Task<IActionResult> GetLogs([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50, [FromQuery] string? userId = null, [FromQuery] string? action = null)
        {
            var logs = await _auditLogService.GetLogsAsync(pageNumber, pageSize, userId, action);
            return Ok(logs);
        }
    }
}
