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

    List<string> ImageUrls,
    [Required] string SellerName,
    [Required] string SellerPhone,

    // Must match stored PIN to authorise the update
    [Required] string EditPin
);