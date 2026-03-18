namespace MixGod.Api.Services;

public interface IPeakService
{
    Task<string> GeneratePeaksAsync(string audioFilePath, string outputPath, CancellationToken ct = default);
}
