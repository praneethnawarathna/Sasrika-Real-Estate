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

    public UploadController(IPhotoService photoService, ILogger<UploadController> logger)
    {
        _photoService = photoService;
        _logger = logger;
    }

    // POST: /api/upload/images
    [HttpPost("images")]
    public async Task<IActionResult> UploadImages([FromForm] List<IFormFile> files)
    {
        if (files == null || files.Count == 0)
        {
            return BadRequest(new { message = "No image files provided." });
        }

        // Validate extensions & size before uploading
        foreach (var file in files)
        {
            if (file.Length == 0) continue;

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
            {
                return BadRequest(new { message = $"File type '{ext}' is not supported. Please upload JPG, PNG, WEBP, or AVIF images." });
            }

            // Max 15 MB per file
            if (file.Length > 15 * 1024 * 1024)
            {
                return BadRequest(new { message = $"File '{file.FileName}' exceeds the 15 MB size limit." });
            }
        }

        try
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var uploadedUrls = await _photoService.UploadPhotosAsync(files, baseUrl);
            return Ok(new { urls = uploadedUrls });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload images");
            return StatusCode(500, new { message = "Image upload failed. " + ex.Message });
        }
    }
}

