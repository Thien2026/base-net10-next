using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SourceBase.Application.DTOs;
using SourceBase.Domain.Entities;
using SourceBase.Infrastructure.Data;

namespace SourceBase.API.Controllers
{
    /// <summary>
    /// Người dùng xem và cập nhật thông tin hồ sơ tùy chỉnh của bản thân
    /// </summary>
    [Authorize]
    public class UserProfileController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public UserProfileController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        /// <summary>
        /// GET /api/userprofile/me
        /// Lấy toàn bộ profile: thông tin cơ bản + tất cả custom fields kèm giá trị hiện tại
        /// </summary>
        [HttpGet("me")]
        public async Task<ActionResult<UserProfileDto>> GetMyProfile()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId.ToString()!);
            if (user == null) return NotFound();

            var activeFields = await _context.UserProfileFieldDefinitions
                .Include(f => f.Group)
                .Where(f => f.IsActive && (f.Group == null || f.Group.IsActive))
                .OrderBy(f => f.DisplayOrder)
                .ToListAsync();

            var myValues = await _context.UserProfileFieldValues
                .Where(v => v.UserId == userId.Value)
                .ToDictionaryAsync(v => v.FieldDefinitionId, v => v.Value);

            var customFields = activeFields.Select(field =>
            {
                List<string>? options = null;
                if (!string.IsNullOrEmpty(field.SelectOptions))
                {
                    try { options = JsonSerializer.Deserialize<List<string>>(field.SelectOptions); } catch { }
                }

                return new ProfileFieldWithValueDto
                {
                    FieldDefinitionId = field.Id,
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
                    GroupId = field.GroupId,
                    GroupName = field.Group?.Name,
                    Value = myValues.TryGetValue(field.Id, out var val) ? val : null
                };
            }).ToList();

            return Ok(new UserProfileDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? "",
                Email = user.Email ?? "",
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                CustomFields = customFields
            });
        }

        /// <summary>
        /// GET /api/userprofile/me/grouped
        /// Lấy hồ sơ của tôi theo cấu trúc nhóm
        /// </summary>
        [HttpGet("me/grouped")]
        public async Task<ActionResult<UserProfileGroupedDto>> GetMyProfileGrouped()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId.ToString()!);
            if (user == null) return NotFound();

            var activeFields = await _context.UserProfileFieldDefinitions
                .Include(f => f.Group)
                .Where(f => f.IsActive && (f.Group == null || f.Group.IsActive))
                .OrderBy(g => g.Group != null ? g.Group.DisplayOrder : int.MaxValue)
                .ThenBy(f => f.DisplayOrder)
                .ToListAsync();

            var myValues = await _context.UserProfileFieldValues
                .Where(v => v.UserId == userId.Value)
                .ToDictionaryAsync(v => v.FieldDefinitionId, v => v.Value);

            var groups = activeFields
                .GroupBy(f => new { f.GroupId, Name = f.Group?.Name ?? "Thông Tin Khác", Order = f.Group?.DisplayOrder ?? int.MaxValue })
                .OrderBy(g => g.Key.Order)
                .Select(g => new ProfileGroupWithFieldsDto
                {
                    GroupId = g.Key.GroupId,
                    GroupName = g.Key.Name,
                    DisplayOrder = g.Key.Order,
                    Fields = g.Select(field =>
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

                        return new ProfileFieldWithValueDto
                        {
                            FieldDefinitionId = field.Id,
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
                            ReferenceSource = field.ReferenceSource,
                            DependsOnField = field.DependsOnField,
                            ConditionalOptions = condOptions,
                            GroupId = field.GroupId,
                            GroupName = field.Group?.Name,
                            Value = myValues.TryGetValue(field.Id, out var val) ? val : null
                        };
                    }).ToList()
                }).ToList();

            return Ok(new UserProfileGroupedDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? "",
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                Groups = groups
            });
        }

        /// <summary>
        /// GET /api/userprofile/{userId}  (Admin xem profile của user khác)
        /// </summary>
        [HttpGet("{userId}")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<ActionResult<UserProfileDto>> GetUserProfile(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return NotFound();

            var activeFields = await _context.UserProfileFieldDefinitions
                .Include(f => f.Group)
                .Where(f => f.IsActive && (f.Group == null || f.Group.IsActive))
                .OrderBy(f => f.DisplayOrder)
                .ToListAsync();

            var userValues = await _context.UserProfileFieldValues
                .Where(v => v.UserId == userId)
                .ToDictionaryAsync(v => v.FieldDefinitionId, v => v.Value);

            var customFields = activeFields.Select(field =>
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

                return new ProfileFieldWithValueDto
                {
                    FieldDefinitionId = field.Id,
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
                    ReferenceSource = field.ReferenceSource,
                    DependsOnField = field.DependsOnField,
                    ConditionalOptions = condOptions,
                    GroupId = field.GroupId,
                    GroupName = field.Group?.Name,
                    Value = userValues.TryGetValue(field.Id, out var val) ? val : null
                };
            }).ToList();

            return Ok(new UserProfileDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? "",
                Email = user.Email ?? "",
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                CustomFields = customFields
            });
        }

        /// <summary>
        /// PUT /api/userprofile/me
        /// User cập nhật giá trị cho các custom fields của bản thân
        /// </summary>
        [HttpPut("me")]
        public async Task<ActionResult<UserProfileDto>> SaveMyProfile([FromBody] SaveProfileFieldValuesDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId.ToString()!);
            if (user == null) return NotFound();

            // Lấy active field definitions
            var activeFieldIds = await _context.UserProfileFieldDefinitions
                .Where(f => f.IsActive)
                .Select(f => f.Id)
                .ToHashSetAsync();

            // Validate required fields
            var requiredFields = await _context.UserProfileFieldDefinitions
                .Where(f => f.IsActive && f.IsRequired)
                .ToListAsync();

            foreach (var required in requiredFields)
            {
                var submitted = dto.Fields.FirstOrDefault(f => f.FieldDefinitionId == required.Id);
                if (submitted == null || string.IsNullOrWhiteSpace(submitted.Value))
                {
                    return BadRequest(new { Message = $"Trường '{required.Label}' là bắt buộc." });
                }
            }

            // Upsert values and validate Regex
            foreach (var input in dto.Fields)
            {
                // Chỉ chấp nhận field còn active
                if (!activeFieldIds.Contains(input.FieldDefinitionId)) continue;

                // Validate Regex nếu có (chỉ validate nếu có nhập giá trị)
                if (!string.IsNullOrWhiteSpace(input.Value))
                {
                    var fieldDef = await _context.UserProfileFieldDefinitions.FindAsync(input.FieldDefinitionId);
                    if (fieldDef != null && !string.IsNullOrWhiteSpace(fieldDef.ValidationRegex))
                    {
                        try
                        {
                            if (!System.Text.RegularExpressions.Regex.IsMatch(input.Value, fieldDef.ValidationRegex))
                            {
                                var msg = string.IsNullOrWhiteSpace(fieldDef.ValidationMessage) 
                                    ? $"Trường '{fieldDef.Label}' không đúng định dạng." 
                                    : fieldDef.ValidationMessage;
                                return BadRequest(new { Message = msg });
                            }
                        }
                        catch (Exception)
                        {
                            // Nếu regex bị lỗi cú pháp, bỏ qua hoặc có thể return Error tùy design.
                            // Ở đây ta có thể log lỗi, tạm thời return BadRequest
                            return BadRequest(new { Message = $"Cấu hình Regex cho trường '{fieldDef.Label}' bị lỗi." });
                        }
                    }
                }

                var existing = await _context.UserProfileFieldValues
                    .FirstOrDefaultAsync(v => v.UserId == userId.Value && v.FieldDefinitionId == input.FieldDefinitionId);

                if (existing == null)
                {
                    _context.UserProfileFieldValues.Add(new UserProfileFieldValue
                    {
                        UserId = userId.Value,
                        FieldDefinitionId = input.FieldDefinitionId,
                        Value = input.Value
                    });
                }
                else
                {
                    existing.Value = input.Value;
                }
            }

            await _context.SaveChangesAsync();

            // Trả về profile mới nhất
            return await GetMyProfile();
        }

        // ===================== Helpers =====================
        private Guid? GetCurrentUserId()
        {
            var str = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(str, out var id) ? id : null;
        }
    }
}
