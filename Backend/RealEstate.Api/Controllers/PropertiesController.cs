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

    // GET /api/properties - returns all properties, newest first
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Property>>> GetAll()
    {
        var properties = await _context.Properties
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(properties);
    }

    // GET /api/properties/{id} - increments ViewCount, returns property
    [HttpGet("{id}")]
    public async Task<ActionResult<Property>> GetById(Guid id)
    {
        var property = await _context.Properties.FindAsync(id);
        if (property == null)
        {
            return NotFound();
        }

        property.ViewCount += 1;
        await _context.SaveChangesAsync();

        return Ok(property);
    }

    // POST /api/properties - creates a new property listing
    [HttpPost]
    public async Task<ActionResult<Property>> Create([FromBody] CreatePropertyDto dto)
    {
        // Auto-calculate PricePerPerch if applicable
        decimal? calculatedPricePerPerch = null;
        if (dto.LandSizePerches.HasValue && dto.LandSizePerches.Value > 0 && dto.Price > 0)
        {
            calculatedPricePerPerch = dto.Price / dto.LandSizePerches.Value;
        }

        // Auto-generate unique reference code: #SR-XXXXX
        var rng = new Random();
        var digits = rng.Next(10000, 99999).ToString();
        var referenceCode = "#SR-" + digits;

        // Fallback image if none provided
        var imageUrls = (dto.ImageUrls != null && dto.ImageUrls.Count > 0)
            ? dto.ImageUrls
            : new List<string>
            {
                "https://placehold.co/800x500/e2e8f0/94a3b8?text=No+Image"
            };

        var property = new Property
        {
            Id = Guid.NewGuid(),
            ReferenceCode = referenceCode,
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
            PricePerPerch = calculatedPricePerPerch,
            ImageUrls = imageUrls,
            SellerName = dto.SellerName,
            SellerPhone = dto.SellerPhone,
            ViewCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = property.Id }, property);
    }
}