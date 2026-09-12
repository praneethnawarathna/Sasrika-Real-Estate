using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RealEstate.Api.Data;
using RealEstate.Api.Dtos;
using RealEstate.Api.Models;

namespace RealEstate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher<User> _passwordHasher;

    public AuthController(
        AppDbContext context,
        IConfiguration configuration,
        IPasswordHasher<User> passwordHasher)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasher = passwordHasher;
    }

    // ── POST /api/auth/register ──────────────────────────────────────────────
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        var exists = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (exists)
        {
            return Conflict(new { message = "An account with this email already exists." });
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Email = normalizedEmail,
            PhoneNumber = dto.PhoneNumber?.Trim(),
            Role = "User",
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return Ok(new AuthResponseDto(token, ToSummary(user)));
    }

    // ── POST /api/auth/login ─────────────────────────────────────────────────
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user == null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            return Unauthorized(new { message = "This account was created with Google Sign-In. Please sign in with Google." });
        }

        var verifyResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
        if (verifyResult == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var token = GenerateJwtToken(user);
        return Ok(new AuthResponseDto(token, ToSummary(user)));
    }

    // ── POST /api/auth/google ────────────────────────────────────────────────
    [HttpPost("google")]
    public async Task<ActionResult<AuthResponseDto>> GoogleLogin([FromBody] GoogleLoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Credential))
        {
            return BadRequest(new { message = "Google credential token is required." });
        }

        GoogleJsonWebSignature.Payload payload;
        try
        {
            var clientId = _configuration["Authentication:Google:ClientId"];
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = !string.IsNullOrEmpty(clientId) ? new[] { clientId } : null
            };

            payload = await GoogleJsonWebSignature.ValidateAsync(dto.Credential, settings);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Invalid Google token: " + ex.Message });
        }

        var email = payload.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (user == null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                FirstName = payload.GivenName ?? "Google",
                LastName = payload.FamilyName ?? "User",
                ProfilePictureUrl = payload.Picture,
                GoogleId = payload.Subject,
                Role = "User",
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
        }
        else
        {
            if (string.IsNullOrEmpty(user.GoogleId))
            {
                user.GoogleId = payload.Subject;
            }
            if (string.IsNullOrEmpty(user.ProfilePictureUrl) && !string.IsNullOrEmpty(payload.Picture))
            {
                user.ProfilePictureUrl = payload.Picture;
            }
        }

        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return Ok(new AuthResponseDto(token, ToSummary(user)));
    }

    // ── POST /api/auth/forgot-password ───────────────────────────────────────
    [HttpPost("forgot-password")]
    public IActionResult ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        return Ok(new
        {
            message = "If an account exists with this email address, password reset instructions have been sent."
        });
    }

    // ── GET /api/auth/me ─────────────────────────────────────────────────────
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserSummaryDto>> GetCurrentUser()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        return Ok(ToSummary(user));
    }

    // ── PUT /api/auth/profile ────────────────────────────────────────────────
    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserSummaryDto>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.FirstName = dto.FirstName.Trim();
        user.LastName = dto.LastName.Trim();
        user.PhoneNumber = dto.PhoneNumber?.Trim();
        if (!string.IsNullOrEmpty(dto.ProfilePictureUrl))
        {
            user.ProfilePictureUrl = dto.ProfilePictureUrl;
        }

        await _context.SaveChangesAsync();
        return Ok(ToSummary(user));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private string GenerateJwtToken(User user)
    {
        var secret = _configuration["JwtSettings:Secret"] ?? "SasrikaRealEstateSuperSecretKey2026!MustBeLongEnoughForHmacSha256SecurityRequirement";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}".Trim()),
            new(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"] ?? "SasrikaRealEstate",
            audience: _configuration["JwtSettings:Audience"] ?? "SasrikaRealEstateApp",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["JwtSettings:ExpiryDays"] ?? "7")),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserSummaryDto ToSummary(User user) =>
        new(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.PhoneNumber,
            user.ProfilePictureUrl,
            user.Role
        );
}
