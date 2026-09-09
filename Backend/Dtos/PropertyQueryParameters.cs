namespace RealEstate.Api.Dtos;

public class PropertyQueryParameters
{
    public string? SearchTerm { get; set; }
    public string? ListingType { get; set; }
    public string? PropertyType { get; set; }
    public string? District { get; set; }
    public string? City { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? SortBy { get; set; } = "newest";
}
