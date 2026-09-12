using System.Text.Json.Serialization;

namespace RealEstate.Api.Models;

public class Property
{
    public Guid Id { get; set; }
    public string ReferenceCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsNegotiable { get; set; }
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;

    public PropertyType PropertyType { get; set; }
    public ListingType ListingType { get; set; }

    public decimal? LandSizePerches { get; set; }
    public int? Bedrooms { get; set; }
    public int? Bathrooms { get; set; }
    public decimal? PricePerPerch { get; set; }

    // Stored as JSON string in SQLite via value converter
    public List<string> ImageUrls { get; set; } = new();

    public string SellerName { get; set; } = string.Empty;
    public string SellerPhone { get; set; } = string.Empty;

    public int ViewCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Moderation workflow
    public ModerationStatus Status { get; set; } = ModerationStatus.Pending;
    public string? RejectionReason { get; set; }
    public DateTime? ModeratedAt { get; set; }

    // Listing status: Active vs Sold
    public bool IsSold { get; set; } = false;

    // Authenticated User Ownership
    public Guid? UserId { get; set; }
    [JsonIgnore]
    public User? User { get; set; }
}