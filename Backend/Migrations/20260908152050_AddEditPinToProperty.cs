using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RealEstate.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEditPinToProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EditPin",
                table: "Properties",
                type: "TEXT",
                nullable: false,
                defaultValue: "1234");

            // Backfill existing rows with default PIN "1234"
            migrationBuilder.Sql("UPDATE \"Properties\" SET \"EditPin\" = '1234' WHERE \"EditPin\" = '' OR \"EditPin\" IS NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EditPin",
                table: "Properties");
        }
    }
}