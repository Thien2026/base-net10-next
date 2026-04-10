using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SourceBase.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddValidationToProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ValidationMessage",
                table: "UserProfileFieldDefinitions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ValidationRegex",
                table: "UserProfileFieldDefinitions",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ValidationMessage",
                table: "UserProfileFieldDefinitions");

            migrationBuilder.DropColumn(
                name: "ValidationRegex",
                table: "UserProfileFieldDefinitions");
        }
    }
}
