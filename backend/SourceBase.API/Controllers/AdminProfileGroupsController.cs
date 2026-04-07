using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SourceBase.Application.DTOs;
using SourceBase.Domain.Entities;
using SourceBase.Infrastructure.Data;

namespace SourceBase.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class AdminProfileGroupsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminProfileGroupsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProfileGroupDto>>> GetGroups()
    {
        return await _context.UserProfileGroups
            .OrderBy(g => g.DisplayOrder)
            .Select(g => new ProfileGroupDto
            {
                Id = g.Id,
                Name = g.Name,
                DisplayOrder = g.DisplayOrder,
                IsActive = g.IsActive
            })
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProfileGroupDto>> GetGroup(Guid id)
    {
        var group = await _context.UserProfileGroups.FindAsync(id);
        if (group == null) return NotFound();

        return new ProfileGroupDto
        {
            Id = group.Id,
            Name = group.Name,
            DisplayOrder = group.DisplayOrder,
            IsActive = group.IsActive
        };
    }

    [HttpPost]
    public async Task<ActionResult<ProfileGroupDto>> CreateGroup(CreateProfileGroupDto dto)
    {
        var group = new UserProfileGroup
        {
            Name = dto.Name,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive
        };

        _context.UserProfileGroups.Add(group);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, new ProfileGroupDto
        {
            Id = group.Id,
            Name = group.Name,
            DisplayOrder = group.DisplayOrder,
            IsActive = group.IsActive
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateGroup(Guid id, UpdateProfileGroupDto dto)
    {
        var group = await _context.UserProfileGroups.FindAsync(id);
        if (group == null) return NotFound();

        group.Name = dto.Name;
        group.DisplayOrder = dto.DisplayOrder;
        group.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGroup(Guid id)
    {
        var group = await _context.UserProfileGroups.FindAsync(id);
        if (group == null) return NotFound();

        // Note: Fields will have GroupId set to NULL due to DeleteBehavior.SetNull configuration
        _context.UserProfileGroups.Remove(group);
        await _context.SaveChangesAsync();
        
        return NoContent();
    }
}
