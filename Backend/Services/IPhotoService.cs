namespace RealEstate.Api.Services;

public interface IPhotoService
{
    Task<List<string>> UploadPhotosAsync(List<IFormFile> files, string baseUrl);
}
