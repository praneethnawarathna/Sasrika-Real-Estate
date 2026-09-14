using System.ComponentModel.DataAnnotations;

namespace RealEstate.Api.Dtos;

public record RegisterDto(
    [Required, StringLength(50)] string FirstName,
    [Required, StringLength(50)] string LastName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")] string Password,
    [RegularExpression(@"^0\d{9}$", ErrorMessage = "Phone number must start with 0 and be exactly 10 digits (e.g., 0771234567)")] string? PhoneNumber
);

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record GoogleLoginDto(
    [Required] string Credential
);

public record ForgotPasswordDto(
    [Required, EmailAddress] string Email
);

public record UpdateProfileDto(
    [Required, StringLength(50)] string FirstName,
    [Required, StringLength(50)] string LastName,
    [RegularExpression(@"^0\d{9}$", ErrorMessage = "Phone number must start with 0 and be exactly 10 digits (e.g., 0771234567)")] string? PhoneNumber,
    string? ProfilePictureUrl
);

public record UserSummaryDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber,
    string? ProfilePictureUrl,
    string Role
);

public record AuthResponseDto(
    string Token,
    UserSummaryDto User
);
