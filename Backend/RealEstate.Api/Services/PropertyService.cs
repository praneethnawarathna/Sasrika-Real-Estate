using RealEstate.Api.Dtos;
using RealEstate.Api.Models;

namespace RealEstate.Api.Services;

public class PropertyService : IPropertyService
{
    private readonly List<Property> _properties = new();

    public List<Property> GetAll()
    {
        return _properties;
    }

    public Property? GetById(Guid id)
    {
        return _properties.FirstOrDefault(p => p.Id == id);
    }

    public Property Create(CreatePropertyDto dto)
    {
        decimal? pricePerPerch = null;
        if (dto.LandSizePerches.HasValue && dto.LandSizePerches.Value > 0 && dto.Price > 0)
        {
            pricePerPerch = dto.Price / dto.LandSizePerches.Value;
        }

        var property = new Property
        {
            Id = Guid.NewGuid(),
            ReferenceCode = "#SR-00000",
            Title = dto.Title,
            Description = dto.Description,
            Price = dto.Price,
            IsNegotiable = dto.IsNegotiable,
            City = dto.City,
            District = dto.District,
            PropertyType = dto.PropertyType,
            ListingType = dto.ListingType,
            LandSizePerches = dto.LandSizePerches,
            Bedrooms = dto.Bedrooms,
            Bathrooms = dto.Bathrooms,
            PricePerPerch = pricePerPerch,
            ImageUrls = dto.ImageUrls ?? new List<string>(),
            SellerName = dto.SellerName,
            SellerPhone = dto.SellerPhone,
            ViewCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        _properties.Add(property);
        return property;
    }
}