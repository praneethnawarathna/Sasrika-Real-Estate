using RealEstate.Api.Dtos;
using RealEstate.Api.Models;

namespace RealEstate.Api.Services;

public class PropertyService : IPropertyService
{
    private readonly List<Property> _properties = new();

    public List<Property> GetAll(PropertyQueryParameters? query = null)
    {
        var items = _properties.AsQueryable();
        if (query != null)
        {
            if (!string.IsNullOrWhiteSpace(query.SearchTerm))
            {
                var term = query.SearchTerm.Trim().ToLower();
                items = items.Where(p =>
                    p.Title.ToLower().Contains(term) ||
                    p.Description.ToLower().Contains(term) ||
                    p.City.ToLower().Contains(term) ||
                    p.District.ToLower().Contains(term));
            }
            if (!string.IsNullOrWhiteSpace(query.ListingType) &&
                !query.ListingType.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                if (Enum.TryParse<ListingType>(query.ListingType, true, out var parsedListingType))
                    items = items.Where(p => p.ListingType == parsedListingType);
                else if (query.ListingType.Equals("sale", StringComparison.OrdinalIgnoreCase))
                    items = items.Where(p => p.ListingType == ListingType.ForSale);
                else if (query.ListingType.Equals("rent", StringComparison.OrdinalIgnoreCase))
                    items = items.Where(p => p.ListingType == ListingType.ForRent);
            }
            if (!string.IsNullOrWhiteSpace(query.PropertyType) &&
                !query.PropertyType.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                if (Enum.TryParse<PropertyType>(query.PropertyType, true, out var parsedPropType))
                    items = items.Where(p => p.PropertyType == parsedPropType);
            }
            if (!string.IsNullOrWhiteSpace(query.District) &&
                !query.District.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var district = query.District.Trim().ToLower();
                items = items.Where(p => p.District.ToLower() == district);
            }
            if (!string.IsNullOrWhiteSpace(query.City))
            {
                var city = query.City.Trim().ToLower();
                items = items.Where(p => p.City.ToLower().Contains(city));
            }
            if (query.MinPrice.HasValue) items = items.Where(p => p.Price >= query.MinPrice.Value);
            if (query.MaxPrice.HasValue) items = items.Where(p => p.Price <= query.MaxPrice.Value);

            switch (query.SortBy?.ToLower())
            {
                case "price_asc":
                case "price-low":
                    items = items.OrderBy(p => p.Price);
                    break;
                case "price_desc":
                case "price-high":
                    items = items.OrderByDescending(p => p.Price);
                    break;
                case "newest":
                default:
                    items = items.OrderByDescending(p => p.CreatedAt);
                    break;
            }
        }
        else
        {
            items = items.OrderByDescending(p => p.CreatedAt);
        }
        return items.ToList();
    }

    public Property? GetById(Guid id) =>
        _properties.FirstOrDefault(p => p.Id == id);

    public Property Create(CreatePropertyDto dto)
    {
        decimal? pricePerPerch = null;
        if (dto.LandSizePerches.HasValue && dto.LandSizePerches.Value > 0 && dto.Price > 0)
            pricePerPerch = dto.Price / dto.LandSizePerches.Value;

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
            EditPin = dto.EditPin,
            ViewCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        _properties.Add(property);
        return property;
    }
}