namespace MixGod.Api.Models;

/// <summary>
/// Maps to the JSON output from the Python analyzer.py script.
/// </summary>
public record AnalysisResult
{
    public double BpmRaw { get; init; }
    public double BpmCorrected { get; init; }
    public bool BpmWasCorrected { get; init; }
    public string Key { get; init; } = string.Empty;
    public string KeyScale { get; init; } = string.Empty;
    public double KeyConfidence { get; init; }
    public int Energy { get; init; }
    public string GenrePrimary { get; init; } = string.Empty;
    public string? GenreSecondary { get; init; }
    public double GenreConfidence { get; init; }
    public double Danceability { get; init; }
    public double Loudness { get; init; }
    public double Duration { get; init; }
    public double BeatsConfidence { get; init; }
}
