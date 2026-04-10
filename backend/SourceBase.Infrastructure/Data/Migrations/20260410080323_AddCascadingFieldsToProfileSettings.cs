using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SourceBase.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCascadingFieldsToProfileSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConditionalOptions",
                table: "UserProfileFieldDefinitions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DependsOnField",
                table: "UserProfileFieldDefinitions",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConditionalOptions",
                table: "UserProfileFieldDefinitions");

            migrationBuilder.DropColumn(
                name: "DependsOnField",
                table: "UserProfileFieldDefinitions");
        }
    }
}
