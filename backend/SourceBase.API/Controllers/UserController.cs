using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SourceBase.Application.DTOs;
using SourceBase.Domain.Entities;
using SourceBase.Infrastructure.Data;

namespace SourceBase.API.Controllers
{
    [Authorize(Roles = "SuperAdmin,Admin,Editor")]
    public class UserController : BaseApiController
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly ApplicationDbContext _context;
        private readonly SourceBase.Application.Interfaces.IFileStorageService _fileStorageService;

        public UserController(
            UserManager<ApplicationUser> userManager, 
            RoleManager<IdentityRole<Guid>> roleManager,
            ApplicationDbContext context,
            SourceBase.Application.Interfaces.IFileStorageService fileStorageService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
            _fileStorageService = fileStorageService;
        }

        [HttpGet("me")]
        [AllowAnonymous]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetMe()
        {
            var userIdStr = HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userIdStr);
            if (user == null) return NotFound();

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                UserName = user.UserName ?? "",
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                Roles = roles,
                IsActive = user.IsActive
            });
        }

        [HttpGet]
        public async Task<ActionResult<PagedResponse<IEnumerable<UserDto>>>> GetUsers(
            [FromQuery] int pageNumber = 1, 
            [FromQuery] int pageSize = 10,
            [FromQuery] string searchTerm = "")
        {
            var query = _userManager.Users.AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var term = searchTerm.ToLower();
                query = query.Where(u => u.UserName.ToLower().Contains(term) || 
                                         u.Email.ToLower().Contains(term) || 
                                         u.FullName.ToLower().Contains(term));
            }

            var totalRecords = await query.CountAsync();
            var users = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // FIX BUGS N+1 QUERY BẰNG KỸ THUẬT JOIN DỮ LIỆU BATCH
            var userIds = users.Select(u => u.Id).ToList();
            var userRolesQuery = await (from ur in _context.UserRoles
                                        where userIds.Contains(ur.UserId)
                                        join r in _context.Roles on ur.RoleId equals r.Id
                                        select new { ur.UserId, r.Name }).ToListAsync();

            var dtos = new List<UserDto>();
            foreach (var u in users)
            {
                var roles = userRolesQuery.Where(ur => ur.UserId == u.Id).Select(ur => ur.Name).ToList();
                dtos.Add(new UserDto
                {
                    Id = u.Id,
                    Email = u.Email ?? "",
                    UserName = u.UserName ?? "",
                    FullName = u.FullName,
                    AvatarUrl = u.AvatarUrl,
                    Roles = roles,
                    IsActive = u.IsActive
                });
            }
            return Ok(new PagedResponse<IEnumerable<UserDto>>(dtos, pageNumber, pageSize, totalRecords));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(Guid id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound();

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                UserName = user.UserName ?? "",
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                Roles = roles,
                IsActive = user.IsActive
            });
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto dto)
        {
            var user = new ApplicationUser
            {
                UserName = string.IsNullOrEmpty(dto.UserName) ? dto.Email : dto.UserName,
                Email = dto.Email,
                FullName = dto.FullName,
                IsActive = true
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            // Create Role if not exists
            if (!await _roleManager.RoleExistsAsync(dto.Role))
            {
                await _roleManager.CreateAsync(new IdentityRole<Guid>(dto.Role));
            }

            await _userManager.AddToRoleAsync(user, dto.Role);
            var roles = await _userManager.GetRolesAsync(user);

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new UserDto 
            { 
                Id = user.Id, 
                Email = user.Email, 
                UserName = user.UserName,
                FullName = user.FullName, 
                AvatarUrl = user.AvatarUrl,
                Roles = roles,
                IsActive = user.IsActive
            });
        }
        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateUser(Guid id, UpdateUserDto dto)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound();

            user.Email = dto.Email;
            if (!string.IsNullOrEmpty(dto.UserName))
            {
                user.UserName = dto.UserName;
            }
            user.FullName = dto.FullName;
            user.IsActive = dto.IsActive;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);

            if (!string.IsNullOrEmpty(dto.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                await _userManager.ResetPasswordAsync(user, token, dto.Password);
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            if (!string.IsNullOrEmpty(dto.Role) && !currentRoles.Contains(dto.Role))
            {
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!await _roleManager.RoleExistsAsync(dto.Role))
                    await _roleManager.CreateAsync(new IdentityRole<Guid>(dto.Role));
                await _userManager.AddToRoleAsync(user, dto.Role);
            }

            var newRoles = await _userManager.GetRolesAsync(user);

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                UserName = user.UserName ?? "",
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                Roles = newRoles,
                IsActive = user.IsActive
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound();

            // Prevent deleting the primary admin account
            if (user.UserName == "admin") 
            {
                return BadRequest(new { Message = "Không thể xóa tài khoản Quản trị gốc." });
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);

            return NoContent();
        }

        [HttpPost("me/avatar")]
        [AllowAnonymous] // We handle auth manually here since Controller has Authorize(Roles)
        [Authorize]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10MB limit
        public async Task<ActionResult<UserDto>> UploadMyAvatar()
        {
            var userIdStr = HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userIdStr);
            if (user == null) return NotFound();

            var files = Request.Form.Files;
            if (files == null || files.Count == 0) return BadRequest("No files uploaded");

            var file = files[0];
            if (!file.ContentType.StartsWith("image/")) return BadRequest("Only images are allowed");

            using var stream = file.OpenReadStream();
            var newAvatarPath = await _fileStorageService.UploadAvatarAsync(stream, file.FileName, user.AvatarUrl);

            user.AvatarUrl = newAvatarPath;
            await _userManager.UpdateAsync(user);

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                UserName = user.UserName ?? "",
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                Roles = roles,
                IsActive = user.IsActive
            });
        }
    }
}
