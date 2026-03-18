using MixGod.Api.Models;

namespace MixGod.Api.Services;

public interface IAnalysisService
{
    Task<AnalysisResult> AnalyzeAsync(string filePath, CancellationToken ct = default);
}
