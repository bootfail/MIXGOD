namespace MixGod.Api.Services;

public interface IDownloadService
{
    Task<Models.DownloadResult> GetMetadataAsync(string url, CancellationToken ct = default);
    Task<string> DownloadAudioAsync(string url, string outputDir, Action<int, string>? onProgress = null, CancellationToken ct = default);
    bool IsAvailable();
}
