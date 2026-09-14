using System.ComponentModel.DataAnnotations;
using RealEstate.Api.Models;

namespace RealEstate.Api.Dtos;

public record UpdatePropertyDto(
    [Required, StringLength(150)] string Title,
    [Required, StringLength(2000)] string Description,
    decimal Price,
    bool IsNegotiable,
    [Required] string City,
    [Required] string District,
    PropertyType PropertyType,
    ListingType ListingType,

    decimal? LandSizePerches,
    int? Bedrooms,
    int? Bathrooms,

    List<string>? ImageUrls,
    string? SellerName,
    [Required(ErrorMessage = "Seller phone is required")]
    [RegularExpression(@"^0\d{9}$", ErrorMessage = "Phone number must start with 0 and be exactly 10 digits (e.g., 0771234567).")]
    string SellerPhone
);