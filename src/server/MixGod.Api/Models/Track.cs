namespace MixGod.Api.Models;

public enum AnalysisStatus
{
    Queued,
    Analyzing,
    Done,
    Error
}

public record Track
{
    public int Id { get; init; }
    public string ServerId { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Artist { get; init; } = string.Empty;
    public double Bpm { get; init; }
    public double BpmRaw { get; init; }
    public bool BpmCorrected { get; init; }
    public string Key { get; init; } = string.Empty;
    public double KeyConfidence { get; init; }
    public int Energy { get; init; }
    public string GenrePrimary { get; init; } = string.Empty;
    public string? GenreSecondary { get; init; }
    public double GenreConfidence { get; init; }
    public double Duration { get; init; }
    public string Format { get; init; } = string.Empty;
    public int Bitrate { get; init; }
    public int SampleRate { get; init; }
    public DateTime DateAdded { get; init; }
    public string Filename { get; init; } = string.Empty;
    public string PeaksUrl { get; init; } = string.Empty;
    public AnalysisStatus AnalysisStatus { get; init; }
    public double AnalysisConfidence { get; init; }
    public Dictionary<string, object>? UserOverrides { get; init; }
}
