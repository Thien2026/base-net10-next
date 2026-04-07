using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SourceBase.Application.Interfaces;
using SourceBase.Domain.Common;
using SourceBase.Domain.Entities;

namespace SourceBase.Infrastructure.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>, IApplicationDbContext
    {
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<UserProfileGroup> UserProfileGroups { get; set; }
        public DbSet<UserProfileFieldDefinition> UserProfileFieldDefinitions { get; set; }
        public DbSet<UserProfileFieldValue> UserProfileFieldValues { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedAt = DateTime.UtcNow;
                        break;
                    case EntityState.Modified:
                        if (entry.Property(x => x.CreatedAt).IsModified)
                            entry.Property(x => x.CreatedAt).IsModified = false;
                        entry.Entity.UpdatedAt = DateTime.UtcNow;
                        break;
                }
            }

            return base.SaveChangesAsync(cancellationToken);
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            
            // Optimize AuditLog queries with indexes
            builder.Entity<AuditLog>(entity =>
            {
                entity.HasIndex(e => e.CreatedAt).IsDescending();
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Action);
            });

            // UserProfileFieldDefinition
            builder.Entity<UserProfileFieldDefinition>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.FieldKey).IsUnique();
                entity.HasIndex(e => e.DisplayOrder);
                entity.Property(e => e.Label).IsRequired().HasMaxLength(200);
                entity.Property(e => e.FieldKey).IsRequired().HasMaxLength(100);
                entity.Property(e => e.SelectOptions).HasMaxLength(2000);
                entity.Property(e => e.Placeholder).HasMaxLength(300);
                entity.Property(e => e.FieldType).HasConversion<string>();

                entity.HasOne(e => e.Group)
                    .WithMany(g => g.Fields)
                    .HasForeignKey(e => e.GroupId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // UserProfileGroup
            builder.Entity<UserProfileGroup>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.DisplayOrder);
            });

            // UserProfileFieldValue - composite unique (UserId + FieldDefinitionId)
            builder.Entity<UserProfileFieldValue>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.UserId, e.FieldDefinitionId }).IsUnique();
                entity.Property(e => e.Value).HasMaxLength(2000);

                entity.HasOne(e => e.FieldDefinition)
                    .WithMany(d => d.Values)
                    .HasForeignKey(e => e.FieldDefinitionId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Do NOT cascade from ApplicationUser to avoid EF cycle issues
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
