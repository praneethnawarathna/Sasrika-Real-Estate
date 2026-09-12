using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;

namespace RealEstate.Api.Services;

public class PhotoService : IPhotoService
{
    private readonly CloudinarySettings _settings;
    private readonly Cloudinary? _cloudinary;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<PhotoService> _logger;

    public PhotoService(
        IOptions<CloudinarySettings> settings,
        IWebHostEnvironment environment,
        ILogger<PhotoService> logger)
    {
        _settings = settings.Value;
        _environment = environment;
        _logger = logger;

        if (_settings.IsConfigured)
        {
            var account = new Account(
                _settings.CloudName,
                _settings.ApiKey,
                _settings.ApiSecret
            );
            _cloudinary = new Cloudinary(account);
            _cloudinary.Api.Secure = true;
            _logger.LogInformation("Cloudinary initialized successfully for cloud: {CloudName}", _settings.CloudName);
        }
        else
        {
            _logger.LogWarning("CloudinarySettings are not fully configured. Falling back to local storage (wwwroot/uploads).");
        }
    }

    public async Task<List<string>> UploadPhotosAsync(List<IFormFile> files, string baseUrl)
    {
        var uploadedUrls = new List<string>();

        if (files == null || files.Count == 0)
        {
            return uploadedUrls;
        }

        if (_cloudinary != null)
        {
            // Upload to Cloudinary
            foreach (var file in files)
            {
                if (file.Length == 0) continue;

                await using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = string.IsNullOrWhiteSpace(_settings.Folder) ? "sasrika/properties" : _settings.Folder,
                    Transformation = new Transformation()
                        .Quality("auto")
                        .FetchFormat("auto")
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                {
                    _logger.LogError("Cloudinary upload error for {FileName}: {Error}", file.FileName, uploadResult.Error.Message);
                    throw new InvalidOperationException($"Cloudinary upload failed: {uploadResult.Error.Message}");
                }

                var secureUrl = uploadResult.SecureUrl?.ToString() ?? uploadResult.Url?.ToString();
                if (!string.IsNullOrEmpty(secureUrl))
                {
                    uploadedUrls.Add(secureUrl);
                }
            }
        }
        else
        {
            // Graceful fallback to local disk storage
            var webRoot = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRoot))
            {
                webRoot = Path.Combine(_environment.ContentRootPath, "wwwroot");
            }

            var uploadsFolder = Path.Combine(webRoot, "uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            foreach (var file in files)
            {
                if (file.Length == 0) continue;

                var ext = Path.GetExtension(file.FileName);
                var uniqueFileName = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
                var destinationPath = Path.Combine(uploadsFolder, uniqueFileName);

                await using (var fileStream = new FileStream(destinationPath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                var localUrl = $"{baseUrl.TrimEnd('/')}/uploads/{uniqueFileName}";
                uploadedUrls.Add(localUrl);
            }
        }

        return uploadedUrls;
    }
}
