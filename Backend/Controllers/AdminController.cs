using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstate.Api.Data;
using RealEstate.Api.Dtos;
using RealEstate.Api.Models;

namespace RealEstate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AdminController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    private bool IsAuthorizedAdmin()
    {
        var masterKey = _configuration["AdminSettings:MasterKey"] ?? "Sasrika@Admin2026";
        if (Request.Headers.TryGetValue("X-Admin-Key", out var headerKey) && headerKey == masterKey)
        {
            return true;
        }

        if (Request.Query.TryGetValue("adminKey", out var queryKey) && queryKey == masterKey)
        {
            return true;
        }

        return false;
    }

    // ── GET /api/admin/verify ────────────────────────────────────────────────
    [HttpGet("verify")]
    public IActionResult VerifyAdmin()
    {
        if (!IsAuthorizedAdmin())
            return Unauthorized(new { message = "Invalid or missing Admin Master Key." });

        return Ok(new { valid = true, role = "admin" });
    }

    // ── GET /api/admin/stats ─────────────────────────────────────────────────
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        if (!IsAuthorizedAdmin())
            return Unauthorized(new { message = "Invalid or missing Admin Master Key." });

        var total = await _context.Properties.CountAsync();
        var pending = await _context.Properties.CountAsync(p => p.Status == ModerationStatus.Pending);
        var approved = await _context.Properties.CountAsync(p => p.Status == ModerationStatus.Approved);
        var rejected = await _context.Properties.CountAsync(p => p.Status == ModerationStatus.Rejected);

        return Ok(new
        {
            total,
            pending,
            approved,
            rejected
        });
    }

    // ── GET /api/admin/properties ────────────────────────────────────────────
    [HttpGet("properties")]
    public async Task<ActionResult<IEnumerable<Property>>> GetProperties(
        [FromQuery] string? status,
        [FromQuery] string? searchTerm)
    {
        if (!IsAuthorizedAdmin())
            return Unauthorized(new { message = "Invalid or missing Admin Master Key." });

        var query = _context.Properties.AsNoTracking().AsQueryable();

        // 1. Status Filter
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            if (status.Equals("pending", StringComparison.OrdinalIgnoreCase))
                query = query.Where(p => p.Status == ModerationStatus.Pending);
            else if (status.Equals("approved", StringComparison.OrdinalIgnoreCase))
                query = query.Where(p => p.Status == ModerationStatus.Approved);
            else if (status.Equals("rejected", StringComparison.OrdinalIgnoreCase))
                query = query.Where(p => p.Status == ModerationStatus.Rejected);
        }

        // 2. Search Term Filter
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim().ToLower();
            query = query.Where(p =>
                p.Title.ToLower().Contains(term) ||
                p.ReferenceCode.ToLower().Contains(term) ||
                p.City.ToLower().Contains(term) ||
                p.District.ToLower().Contains(term) ||
                p.SellerName.ToLower().Contains(term) ||
                p.SellerPhone.ToLower().Contains(term));
        }

        var properties = await query
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(properties);
    }

    // ── GET /api/admin/properties/{id} ───────────────────────────────────────
    [HttpGet("properties/{id}")]
    public async Task<ActionResult<Property>> GetPropertyById(Guid id)
    {
        if (!IsAuthorizedAdmin())
            return Unauthorized(new { message = "Invalid or missing Admin Master Key." });

        var property = await _context.Properties.FindAsync(id);
        if (property == null) return NotFound();

        return Ok(property);
    }

    // ── POST /api/admin/properties/{id}/approve ──────────────────────────────
    [HttpPost("properties/{id}/approve")]
    public async Task<ActionResult<Property>> ApproveProperty(Guid id)
    {
        if (!IsAuthorizedAdmin())
            return Unauthorized(new { message = "Invalid or missing Admin Master Key." });

        var property = await _context.Properties.FindAsync(id);
        if (property == null) return NotFound();

        property.Status = ModerationStatus.Approved;
        property.ModeratedAt = DateTime.UtcNow;
        property.RejectionReason = null;

        await _context.SaveChangesAsync();
        return Ok(property);
    }

    // ── POST /api/admin/properties/{id}/reject ───────────────────────────────
    [HttpPost("properties/{id}/reject")]
    public async Task<ActionResult<Property>> RejectProperty(Guid id, [FromBody] RejectPropertyDto? dto)
    {
        if (!IsAuthorizedAdmin())
            return Unauthorized(new { message = "Invalid or missing Admin Master Key." });

        var property = await _context.Properties.FindAsync(id);
        if (property == null) return NotFound();

        property.Status = ModerationStatus.Rejected;
        property.ModeratedAt = DateTime.UtcNow;
        property.RejectionReason = !string.IsNullOrWhiteSpace(dto?.Reason)
            ? dto.Reason.Trim()
            : "Does not meet listing standards or unverified details.";

        await _context.SaveChangesAsync();
        return Ok(property);
    }

    // ── DELETE /api/admin/properties/{id} ────────────────────────────────────
    [HttpDelete("properties/{id}")]
    public async Task<IActionResult> DeleteProperty(Guid id)
    {
        if (!IsAuthorizedAdmin())
            return Unauthorized(new { message = "Invalid or missing Admin Master Key." });

        var property = await _context.Properties.FindAsync(id);
        if (property == null) return NotFound();

        _context.Properties.Remove(property);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
