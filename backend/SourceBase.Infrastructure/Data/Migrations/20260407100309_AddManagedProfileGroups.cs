using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SourceBase.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddManagedProfileGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserProfileGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserProfileGroups", x => x.Id);
                });

            migrationBuilder.AddColumn<Guid>(
                name: "GroupId",
                table: "UserProfileFieldDefinitions",
                type: "uuid",
                nullable: true);

            // Data Migration: Move GroupName strings to the new UserProfileGroups table
            migrationBuilder.Sql(@"
                INSERT INTO ""UserProfileGroups"" (""Id"", ""Name"", ""DisplayOrder"", ""IsActive"", ""CreatedAt"")
                SELECT gen_random_uuid(), ""GroupName"", 0, true, now()
                FROM ""UserProfileFieldDefinitions""
                WHERE ""GroupName"" IS NOT NULL AND ""GroupName"" <> ''
                GROUP BY ""GroupName"";

                UPDATE ""UserProfileFieldDefinitions"" f
                SET ""GroupId"" = g.""Id""
                FROM ""UserProfileGroups"" g
                WHERE f.""GroupName"" = g.""Name"";
            ");

            migrationBuilder.DropColumn(
                name: "GroupName",
                table: "UserProfileFieldDefinitions");

            migrationBuilder.CreateIndex(
                name: "IX_UserProfileFieldDefinitions_GroupId",
                table: "UserProfileFieldDefinitions",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_UserProfileGroups_DisplayOrder",
                table: "UserProfileGroups",
                column: "DisplayOrder");

            migrationBuilder.AddForeignKey(
                name: "FK_UserProfileFieldDefinitions_UserProfileGroups_GroupId",
                table: "UserProfileFieldDefinitions",
                column: "GroupId",
                principalTable: "UserProfileGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GroupName",
                table: "UserProfileFieldDefinitions",
                type: "text",
                nullable: true);

            // Restore GroupName strings from the Groups table
            migrationBuilder.Sql(@"
                UPDATE ""UserProfileFieldDefinitions"" f
                SET ""GroupName"" = g.""Name""
                FROM ""UserProfileGroups"" g
                WHERE f.""GroupId"" = g.""Id"";
            ");

            migrationBuilder.DropForeignKey(
                name: "FK_UserProfileFieldDefinitions_UserProfileGroups_GroupId",
                table: "UserProfileFieldDefinitions");

            migrationBuilder.DropTable(
                name: "UserProfileGroups");

            migrationBuilder.DropIndex(
                name: "IX_UserProfileFieldDefinitions_GroupId",
                table: "UserProfileFieldDefinitions");

            migrationBuilder.DropColumn(
                name: "GroupId",
                table: "UserProfileFieldDefinitions");
        }
    }
}
