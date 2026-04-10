using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SourceBase.Application.DTOs;
using SourceBase.Domain.Entities;
using SourceBase.Infrastructure.Data;

namespace SourceBase.API.Controllers
{
    /// <summary>
    /// Admin quản lý định nghĩa các trường thông tin người dùng tùy chỉnh
    /// </summary>
    [Authorize(Roles = "SuperAdmin,Admin")]
    public class AdminProfileFieldsController : BaseApiController
    {
        private readonly ApplicationDbContext _context;

        public AdminProfileFieldsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET /api/adminprofilefields
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProfileFieldDefinitionDto>>> GetAll()
        {
            var fields = await _context.UserProfileFieldDefinitions
                .Include(f => f.Group)
                .OrderBy(f => f.DisplayOrder)
                .ThenBy(f => f.CreatedAt)
                .ToListAsync();

            return Ok(fields.Select(MapToDto));
        }

        // GET /api/adminprofilefields/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ProfileFieldDefinitionDto>> GetById(Guid id)
        {
            var field = await _context.UserProfileFieldDefinitions
                .Include(f => f.Group)
                .FirstOrDefaultAsync(f => f.Id == id);
            
            if (field == null) return NotFound();
            return Ok(MapToDto(field));
        }

        // POST /api/adminprofilefields
        [HttpPost]
        public async Task<ActionResult<ProfileFieldDefinitionDto>> Create([FromBody] CreateProfileFieldDefinitionDto dto)
        {
            // Kiểm tra FieldKey unique
            var exists = await _context.UserProfileFieldDefinitions
                .AnyAsync(f => f.FieldKey == dto.FieldKey);
            if (exists)
                return BadRequest(new { Message = $"FieldKey '{dto.FieldKey}' đã tồn tại." });

            if (!Enum.TryParse<ProfileFieldType>(dto.FieldType, ignoreCase: true, out var fieldType))
                return BadRequest(new { Message = $"FieldType '{dto.FieldType}' không hợp lệ." });

            var field = new UserProfileFieldDefinition
            {
                Label = dto.Label,
                FieldKey = dto.FieldKey.ToLowerInvariant().Replace(" ", "_"),
                FieldType = fieldType,
                IsRequired = dto.IsRequired,
                DisplayOrder = dto.DisplayOrder,
                SelectOptions = dto.SelectOptions != null
                    ? JsonSerializer.Serialize(dto.SelectOptions)
                    : null,
                Placeholder = dto.Placeholder,
                Icon = dto.Icon,
                ValidationRegex = dto.ValidationRegex,
                ValidationMessage = dto.ValidationMessage,
                DependsOnField = dto.DependsOnField,
                ConditionalOptions = dto.ConditionalOptions != null ? JsonSerializer.Serialize(dto.ConditionalOptions) : null,
                ReferenceSource = dto.ReferenceSource,
                GroupId = dto.GroupId,
                IsActive = dto.IsActive
            };

            _context.UserProfileFieldDefinitions.Add(field);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = field.Id }, MapToDto(field));
        }

        // PUT /api/adminprofilefields/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<ProfileFieldDefinitionDto>> Update(Guid id, [FromBody] UpdateProfileFieldDefinitionDto dto)
        {
            var field = await _context.UserProfileFieldDefinitions.FindAsync(id);
            if (field == null) return NotFound();

            if (!Enum.TryParse<ProfileFieldType>(dto.FieldType, ignoreCase: true, out var fieldType))
                return BadRequest(new { Message = $"FieldType '{dto.FieldType}' không hợp lệ." });

            field.Label = dto.Label;
            field.FieldType = fieldType;
            field.IsRequired = dto.IsRequired;
            field.DisplayOrder = dto.DisplayOrder;
            field.SelectOptions = dto.SelectOptions != null
                ? JsonSerializer.Serialize(dto.SelectOptions)
                : null;
            field.Placeholder = dto.Placeholder;
            field.Icon = dto.Icon;
            field.ValidationRegex = dto.ValidationRegex;
            field.ValidationMessage = dto.ValidationMessage;
            field.DependsOnField = dto.DependsOnField;
            field.ConditionalOptions = dto.ConditionalOptions != null ? JsonSerializer.Serialize(dto.ConditionalOptions) : null;
            field.ReferenceSource = dto.ReferenceSource;
            field.GroupId = dto.GroupId;
            field.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return Ok(MapToDto(field));
        }

        // DELETE /api/adminprofilefields/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var field = await _context.UserProfileFieldDefinitions.FindAsync(id);
            if (field == null) return NotFound();

            _context.UserProfileFieldDefinitions.Remove(field);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ===================== Helpers =====================
        private static ProfileFieldDefinitionDto MapToDto(UserProfileFieldDefinition field)
        {
            List<string>? options = null;
            if (!string.IsNullOrEmpty(field.SelectOptions))
            {
                try { options = JsonSerializer.Deserialize<List<string>>(field.SelectOptions); } catch { }
            }

            Dictionary<string, List<string>>? condOptions = null;
            if (!string.IsNullOrEmpty(field.ConditionalOptions))
            {
                try { condOptions = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(field.ConditionalOptions); } catch { }
            }

            return new ProfileFieldDefinitionDto
            {
                Id = field.Id,
                Label = field.Label,
                FieldKey = field.FieldKey,
                FieldType = field.FieldType.ToString(),
                IsRequired = field.IsRequired,
                DisplayOrder = field.DisplayOrder,
                SelectOptions = options,
                Placeholder = field.Placeholder,
                Icon = field.Icon,
                ValidationRegex = field.ValidationRegex,
                ValidationMessage = field.ValidationMessage,
                DependsOnField = field.DependsOnField,
                ConditionalOptions = condOptions,
                ReferenceSource = field.ReferenceSource,
                GroupId = field.GroupId,
                GroupName = field.Group?.Name,
                IsActive = field.IsActive,
                CreatedAt = field.CreatedAt,
                UpdatedAt = field.UpdatedAt
            };
        }
    }
}
