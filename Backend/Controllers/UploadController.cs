using Microsoft.AspNetCore.Mvc;

namespace RealEstate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"
    };

    public UploadController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    // POST: /api/upload/images
    [HttpPost("images")]
    public async Task<IActionResult> UploadImages([FromForm] List<IFormFile> files)
    {
        if (files == null || files.Count == 0)
        {
            return BadRequest(new { message = "No image files provided." });
        }

        var webRoot = _environment.WebRootPath;
        if (string.IsNullOrEmpty(webRoot))
        {
            webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        var uploadsFolder = Path.Combine(webRoot, "uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uploadedUrls = new List<string>();

        foreach (var file in files)
        {
            if (file.Length == 0) continue;

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
            {
                return BadRequest(new { message = $"File type '{ext}' is not supported. Please upload JPG, PNG, or WEBP images." });
            }

            // Max 15 MB per file
            if (file.Length > 15 * 1024 * 1024)
            {
                return BadRequest(new { message = $"File '{file.FileName}' exceeds the 15 MB size limit." });
            }

            var uniqueFileName = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
            var destinationPath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(destinationPath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{uniqueFileName}";
            uploadedUrls.Add(fileUrl);
        }

        return Ok(new { urls = uploadedUrls });
    }
}
