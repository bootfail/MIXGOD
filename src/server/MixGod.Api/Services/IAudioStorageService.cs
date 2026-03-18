using Microsoft.AspNetCore.Http;

namespace MixGod.Api.Services;

public interface IAudioStorageService
{
    Task<string> StoreAsync(IFormFile file, string trackId);
    string GetFilePath(string trackId);
    FileStream GetStream(string trackId);
    Task DeleteAsync(string trackId);
    bool IsValidAudioFile(string fileName);
}
