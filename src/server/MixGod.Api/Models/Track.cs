namespace MixGod.Api.Models;

public enum AnalysisStatus
{
    Queued,
    Analyzing,
    Done,
    Error
}

public class Track
{
    public string Id { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public double Bpm { get; set; }
    public double BpmRaw { get; set; }
    public bool BpmCorrected { get; set; }
    public string Key { get; set; } = string.Empty;
    public double KeyConfidence { get; set; }
    public int Energy { get; set; }
    public string GenrePrimary { get; set; } = string.Empty;
    public string? GenreSecondary { get; set; }
    public double GenreConfidence { get; set; }
    public double Duration { get; set; }
    public string Format { get; set; } = string.Empty;
    public int Bitrate { get; set; }
    public int SampleRate { get; set; }
    public DateTime DateAdded { get; set; }
    public string Filename { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? PeaksUrl { get; set; }
    public AnalysisStatus AnalysisStatus { get; set; } = AnalysisStatus.Queued;
    public double AnalysisConfidence { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object>? UserOverrides { get; set; }
}
