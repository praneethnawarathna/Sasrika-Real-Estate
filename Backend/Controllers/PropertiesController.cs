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
    public async Task<ActionResult<IEnumerable<Property>>> GetAll()
    {
        var properties = await _context.Properties
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(properties);
    }

    // ── GET /api/properties/{id} ─────────────────────────────────────────────
    [HttpGet("{id}")]
    public async Task<ActionResult<Property>> GetById(Guid id)
    {
        var property = await _context.Properties.FindAsync(id);
        if (property == null) return NotFound();

        property.ViewCount += 1;
        await _context.SaveChangesAsync();
        return Ok(property);
    }

    // ── POST /api/properties ─────────────────────────────────────────────────
    [HttpPost]
    public async Task<ActionResult<Property>> Create([FromBody] CreatePropertyDto dto)
    {
        decimal? calculatedPricePerPerch = null;
        if (dto.LandSizePerches.HasValue && dto.LandSizePerches.Value > 0 && dto.Price > 0)
            calculatedPricePerPerch = dto.Price / dto.LandSizePerches.Value;

        var rng = new Random();
        var referenceCode = "#SR-" + rng.Next(10000, 99999).ToString();

        var imageUrls = (dto.ImageUrls != null && dto.ImageUrls.Count > 0)
            ? dto.ImageUrls
            : new List<string> { "https://placehold.co/800x500/e2e8f0/94a3b8?text=No+Image" };

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
            EditPin = dto.EditPin,
            ViewCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = property.Id }, property);
    }

    // ── POST /api/properties/{id}/verify-pin ─────────────────────────────────
    [HttpPost("{id}/verify-pin")]
    public async Task<IActionResult> VerifyPin(Guid id, [FromBody] VerifyPinDto dto)
    {
        var property = await _context.Properties.FindAsync(id);
        if (property == null) return NotFound();

        if (property.EditPin != dto.EditPin)
            return Unauthorized(new { message = "Incorrect PIN. Please try again." });

        return Ok(new { isValid = true });
    }

    // ── PUT /api/properties/{id} ─────────────────────────────────────────────
    [HttpPut("{id}")]
    public async Task<ActionResult<Property>> Update(Guid id, [FromBody] UpdatePropertyDto dto)
    {
        var property = await _context.Properties.FindAsync(id);
        if (property == null) return NotFound();

        if (property.EditPin != dto.EditPin)
            return Unauthorized(new { message = "Invalid PIN. You are not authorised to edit this listing." });

        // Recalculate price-per-perch
        decimal? pricePerPerch = null;
        if (dto.LandSizePerches.HasValue && dto.LandSizePerches.Value > 0 && dto.Price > 0)
            pricePerPerch = dto.Price / dto.LandSizePerches.Value;

        property.Title = dto.Title;
        property.Description = dto.Description;
        property.Price = dto.Price;
        property.IsNegotiable = dto.IsNegotiable;
        property.City = dto.City;
        property.District = dto.District;
        property.PropertyType = dto.PropertyType;
        property.ListingType = dto.ListingType;
        property.LandSizePerches = dto.LandSizePerches;
        property.Bedrooms = dto.Bedrooms;
        property.Bathrooms = dto.Bathrooms;
        property.PricePerPerch = pricePerPerch;
        property.ImageUrls = (dto.ImageUrls != null && dto.ImageUrls.Count > 0)
            ? dto.ImageUrls
            : property.ImageUrls;
        property.SellerName = dto.SellerName;
        property.SellerPhone = dto.SellerPhone;

        await _context.SaveChangesAsync();
        return Ok(property);
    }

    // ── DELETE /api/properties/{id}?pin=XXXX ─────────────────────────────────
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, [FromQuery] string? pin)
    {
        var property = await _context.Properties.FindAsync(id);
        if (property == null) return NotFound();

        string? suppliedPin = pin;
        if (string.IsNullOrWhiteSpace(suppliedPin) && Request.HasJsonContentType())
        {
            try
            {
                var body = await Request.ReadFromJsonAsync<VerifyPinDto>();
                suppliedPin = body?.EditPin;
            }
            catch { }
        }

        if (string.IsNullOrWhiteSpace(suppliedPin) || property.EditPin != suppliedPin)
            return Unauthorized(new { message = "Invalid PIN. You are not authorised to delete this listing." });

        _context.Properties.Remove(property);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}