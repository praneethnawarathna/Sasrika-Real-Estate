using Microsoft.AspNetCore.Mvc;
using RealEstate.Api.Services;

namespace RealEstate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly IPhotoService _photoService;
    private readonly ILogger<UploadController> _logger;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"
    };

    private const int MaxFiles = 10;
    private const long MaxFileSizeBytes = 15L * 1024 * 1024; // 15 MB per file

    public UploadController(IPhotoService photoService, ILogger<UploadController> logger)
    {
        _photoService = photoService;
        _logger = logger;
    }

    // POST: /api/upload/images
    // Accepts up to 10 image files; returns { urls: ["https://...", ...] }
    [HttpPost("images")]
    [RequestSizeLimit(150_000_000)]          // 150 MB max total (10 × 15 MB)
    [RequestFormLimits(MultipartBodyLengthLimit = 150_000_000)]
    public async Task<IActionResult> UploadImages([FromForm] List<IFormFile> files)
    {
        if (files == null || files.Count == 0)
            return BadRequest(new { message = "No image files provided." });

        if (files.Count > MaxFiles)
            return BadRequest(new { message = $"You can upload a maximum of {MaxFiles} photos at once." });

        // Validate each file before touching Cloudinary
        foreach (var file in files)
        {
            if (file.Length == 0) continue;

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
            {
                return BadRequest(new
                {
                    message = $"File type '{ext}' is not allowed. Please upload JPG, PNG, WEBP, or AVIF images."
                });
            }

            if (file.Length > MaxFileSizeBytes)
            {
                return BadRequest(new
                {
                    message = $"'{file.FileName}' exceeds the {MaxFileSizeBytes / 1024 / 1024} MB size limit."
                });
            }
        }

        try
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var uploadedUrls = await _photoService.UploadPhotosAsync(files, baseUrl);

            _logger.LogInformation("Uploaded {Count} image(s) successfully.", uploadedUrls.Count);
            return Ok(new { urls = uploadedUrls });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Image upload failed.");
            return StatusCode(500, new { message = "Image upload failed. " + ex.Message });
        }
    }
}
