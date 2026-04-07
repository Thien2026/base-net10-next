using System;
using Microsoft.AspNetCore.Identity;

namespace SourceBase.Domain.Entities
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        public string FullName { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string? AvatarUrl { get; set; }
        // IdentityUser provides Email, UserName, PasswordHash, PhoneNumber, etc.
    }
}
