using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstate.Api.Data;
using RealEstate.Api.Dtos;
using RealEstate.Api.Models;

namespace RealEstate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PropertiesController : ControllerBase
{
    private readonly AppDbContext _context;

    public PropertiesController(AppDbContext context)
    {
        _context = context;
    }

    // ── GET /api/properties ──────────────────────────────────────────────────
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Property>>> GetAll([FromQuery] PropertyQueryParameters? query)
    {
        var items = _context.Properties.AsNoTracking().Where(p => p.Status == ModerationStatus.Approved).AsQueryable();

        if (query != null)
        {
            // 1. Search Term (Title, Description, City, District)
            if (!string.IsNullOrWhiteSpace(query.SearchTerm))
            {
                var term = query.SearchTerm.Trim().ToLower();
                items = items.Where(p =>
                    p.Title.ToLower().Contains(term) ||
                    p.Description.ToLower().Contains(term) ||
                    p.City.ToLower().Contains(term) ||
                    p.District.ToLower().Contains(term));
            }

            // 2. Listing Type (ForSale, ForRent, sale, rent, 0, 1)
            if (!string.IsNullOrWhiteSpace(query.ListingType) &&
                !query.ListingType.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                if (Enum.TryParse<ListingType>(query.ListingType, true, out var parsedListingType))
                {
                    items = items.Where(p => p.ListingType == parsedListingType);
                }
                else if (query.ListingType.Equals("sale", StringComparison.OrdinalIgnoreCase))
                {
                    items = items.Where(p => p.ListingType == ListingType.ForSale);
                }
                else if (query.ListingType.Equals("rent", StringComparison.OrdinalIgnoreCase))
                {
                    items = items.Where(p => p.ListingType == ListingType.ForRent);
                }
            }

            // 3. Property Type (House, Land, Commercial, 0, 1, 2)
            if (!string.IsNullOrWhiteSpace(query.PropertyType) &&
                !query.PropertyType.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                if (Enum.TryParse<PropertyType>(query.PropertyType, true, out var parsedPropType))
                {
                    items = items.Where(p => p.PropertyType == parsedPropType);
                }
            }

            // 4. District
            if (!string.IsNullOrWhiteSpace(query.District) &&
                !query.District.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var district = query.District.Trim().ToLower();
                items = items.Where(p => p.District.ToLower() == district);
            }

            // 5. City
            if (!string.IsNullOrWhiteSpace(query.City))
            {
                var city = query.City.Trim().ToLower();
                items = items.Where(p => p.City.ToLower().Contains(city));
            }

            // 6. Min and Max Price
            if (query.MinPrice.HasValue)
            {
                items = items.Where(p => p.Price >= query.MinPrice.Value);
            }
            if (query.MaxPrice.HasValue)
            {
                items = items.Where(p => p.Price <= query.MaxPrice.Value);
            }

            // 7. Sorting
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

        var properties = await items.ToListAsync();
        return Ok(properties);
    }

    // ── GET /api/properties/my-listings ──────────────────────────────────────
    [Authorize]
    [HttpGet("my-listings")]
    public async Task<ActionResult<IEnumerable<Property>>> GetMyListings()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var listings = await _context.Properties
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(listings);
    }

    // ── GET /api/properties/{id} ─────────────────────────────────────────────
    [HttpGet("{id}")]
    public async Task<ActionResult<Property>> GetById(Guid id)
    {
        var property = await _context.Properties.FindAsync(id);
        if (property == null) return NotFound();

        // If not approved, allow only owner or admin to view it
        if (property.Status != ModerationStatus.Approved)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isOwner = Guid.TryParse(userIdStr, out var userId) && property.UserId == userId;
            var isAdmin = User.IsInRole("Admin");

            if (!isOwner && !isAdmin)
            {
                return NotFound();
            }
        }

        property.ViewCount += 1;
        await _context.SaveChangesAsync();
        return Ok(property);
    }

    // ── POST /api/properties ─────────────────────────────────────────────────
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<Property>> Create([FromBody] CreatePropertyDto dto)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Unauthorized(new { message = "User not found." });
        }

        decimal? calculatedPricePerPerch = null;
        if (dto.ListingType == ListingType.ForSale && dto.PropertyType == PropertyType.Land &&
            dto.LandSizePerches.HasValue && dto.LandSizePerches.Value > 0 && dto.Price > 0)
        {
            calculatedPricePerPerch = dto.Price / dto.LandSizePerches.Value;
        }

        var rng = new Random();
        var referenceCode = "#SR-" + rng.Next(10000, 99999).ToString();

        var imageUrls = (dto.ImageUrls != null && dto.ImageUrls.Count > 0)
            ? dto.ImageUrls
            : new List<string> { "https://placehold.co/800x500/e2e8f0/94a3b8?text=No+Image" };

        var sellerName = !string.IsNullOrWhiteSpace(dto.SellerName)
            ? dto.SellerName.Trim()
            : $"{user.FirstName} {user.LastName}".Trim();

        var sellerPhone = !string.IsNullOrWhiteSpace(dto.SellerPhone)
            ? dto.SellerPhone.Trim()
            : user.PhoneNumber ?? string.Empty;

        var property = new Property
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ReferenceCode = referenceCode,
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            Price = dto.Price,
            IsNegotiable = dto.IsNegotiable,
            City = dto.City.Trim(),
            District = dto.District.Trim(),
            PropertyType = dto.PropertyType,
            ListingType = dto.ListingType,
            LandSizePerches = dto.LandSizePerches,
            Bedrooms = dto.Bedrooms,
            Bathrooms = dto.Bathrooms,
            PricePerPerch = calculatedPricePerPerch,
            ImageUrls = imageUrls,
            SellerName = sellerName,
            SellerPhone = sellerPhone,
            Status = ModerationStatus.Pending,
            IsSold = false,
            ViewCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = property.Id }, property);
    }

    // ── PUT /api/properties/{id} ─────────────────────────────────────────────
    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<Property>> Update(Guid id, [FromBody] UpdatePropertyDto dto)
    {
        var property = await _context.Properties.FindAsync(id);
        if (property == null) return NotFound();

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isOwner = Guid.TryParse(userIdStr, out var userId) && property.UserId == userId;
        var isAdmin = User.IsInRole("Admin");

        if (!isOwner && !isAdmin)
        {
            return Forbid();
        }

        // Recalculate price-per-perch (ONLY for Land For Sale)
        decimal? pricePerPerch = null;
        if (dto.ListingType == ListingType.ForSale && dto.PropertyType == PropertyType.Land &&
            dto.LandSizePerches.HasValue && dto.LandSizePerches.Value > 0 && dto.Price > 0)
        {
            pricePerPerch = dto.Price / dto.LandSizePerches.Value;
        }

        property.Title = dto.Title.Trim();
        property.Description = dto.Description.Trim();
        property.Price = dto.Price;
        property.IsNegotiable = dto.IsNegotiable;
        property.City = dto.City.Trim();
        property.District = dto.District.Trim();
        property.PropertyType = dto.PropertyType;
        property.ListingType = dto.ListingType;
        property.LandSizePerches = dto.LandSizePerches;
        property.Bedrooms = dto.Bedrooms;
        property.Bathrooms = dto.Bathrooms;
        property.PricePerPerch = pricePerPerch;

        if (dto.ImageUrls != null && dto.ImageUrls.Count > 0)
        {
            property.ImageUrls = dto.ImageUrls;
        }

        if (!string.IsNullOrWhiteSpace(dto.SellerName))
        {
            property.SellerName = dto.SellerName.Trim();
        }
        if (!string.IsNullOrWhiteSpace(dto.SellerPhone))
        {
            property.SellerPhone = dto.SellerPhone.Trim();
        }

        await _context.SaveChangesAsync();
        return Ok(property);
    }

    // ── PATCH /api/properties/{id}/toggle-sold ───────────────────────────────
    [Authorize]
    [HttpPatch("{id}/toggle-sold")]
    public async Task<ActionResult<Property>> ToggleSold(Guid id)
    {
        var property = await _context.Properties.FindAsync(id);
        if (property == null) return NotFound();

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isOwner = Guid.TryParse(userIdStr, out var userId) && property.UserId == userId;
        var isAdmin = User.IsInRole("Admin");

        if (!isOwner && !isAdmin)
        {
            return Forbid();
        }

        property.IsSold = !property.IsSold;
        await _context.SaveChangesAsync();
        return Ok(property);
    }

    // ── DELETE /api/properties/{id} ──────────────────────────────────────────
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var property = await _context.Properties.FindAsync(id);
        if (property == null) return NotFound();

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isOwner = Guid.TryParse(userIdStr, out var userId) && property.UserId == userId;
        var isAdmin = User.IsInRole("Admin");

        if (!isOwner && !isAdmin)
        {
            return Forbid();
        }

        _context.Properties.Remove(property);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}