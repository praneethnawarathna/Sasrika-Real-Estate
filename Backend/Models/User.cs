using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace RealEstate.Api.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    [JsonIgnore]
    public string? PasswordHash { get; set; }

    [RegularExpression(@"^0\d{9}$", ErrorMessage = "Phone number must start with 0 and be exactly 10 digits (e.g., 0771234567)")]
    public string? PhoneNumber { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string Role { get; set; } = "User"; // "User" | "Admin"
    public string? GoogleId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public List<Property> Properties { get; set; } = new();
}
