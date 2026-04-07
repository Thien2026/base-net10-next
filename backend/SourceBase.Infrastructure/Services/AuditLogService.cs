using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SourceBase.Application.DTOs;
using SourceBase.Application.DTOs.AuditLogs;
using SourceBase.Application.Interfaces;
using SourceBase.Domain.Entities;
using SourceBase.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SourceBase.Infrastructure.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditLogService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task LogAsync(string action, string target, string? detail = null)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var userId = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var userName = user?.Identity?.Name ?? string.Empty;
            var ipAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? string.Empty;

            var log = new AuditLog
            {
                UserId = userId,
                UserName = userName,
                Action = action,
                Target = target,
                Detail = detail,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task<PagedResponse<IEnumerable<AuditLogDto>>> GetLogsAsync(int pageNumber = 1, int pageSize = 50, string? userId = null, string? action = null)
        {
            var query = _context.AuditLogs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrEmpty(userId))
            {
                query = query.Where(l => l.UserId == userId);
            }

            if (!string.IsNullOrEmpty(action))
            {
                query = query.Where(l => l.Action == action);
            }

            var totalRecords = await query.CountAsync();
            var logs = await query
                .OrderByDescending(l => l.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new AuditLogDto
                {
                    Id = l.Id,
                    UserId = l.UserId,
                    UserName = l.UserName,
                    Action = l.Action,
                    Target = l.Target,
                    Detail = l.Detail,
                    IpAddress = l.IpAddress,
                    CreatedAt = l.CreatedAt
                })
                .ToListAsync();

            return new PagedResponse<IEnumerable<AuditLogDto>>(logs, pageNumber, pageSize, totalRecords);
        }
    }
}
