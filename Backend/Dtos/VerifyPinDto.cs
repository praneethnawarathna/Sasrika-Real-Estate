using System.ComponentModel.DataAnnotations;

namespace RealEstate.Api.Dtos;

public record VerifyPinDto(
    [Required] string EditPin
);