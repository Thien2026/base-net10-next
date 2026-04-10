using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SourceBase.Domain.Entities;
using SourceBase.Infrastructure.Data;

namespace SourceBase.API.Controllers
{
    public class SettingController : BaseApiController
    {
        private readonly ApplicationDbContext _context;

        public SettingController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<Dictionary<string, string?>>> GetSettings()
        {
            var settings = await _context.SystemSettings.ToListAsync();
            var result = settings.ToDictionary(s => s.Key, s => s.Value);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> UpdateSettings([FromBody] Dictionary<string, string?> newSettings)
        {
            if (newSettings == null)
            {
                return BadRequest("Invalid settings payload.");
            }

            var currentSettings = await _context.SystemSettings.ToListAsync();

            foreach (var kvp in newSettings)
            {
                var existing = currentSettings.FirstOrDefault(s => s.Key == kvp.Key);
                if (existing != null)
                {
                    existing.Value = kvp.Value;
                }
                else
                {
                    _context.SystemSettings.Add(new SystemSetting
                    {
                        Key = kvp.Key,
                        Value = kvp.Value
                    });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Settings updated successfully." });
        }
    }
}
