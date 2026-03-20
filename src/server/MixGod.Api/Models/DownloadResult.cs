namespace MixGod.Api.Models;

public class DownloadResult
{
    public string FilePath { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public string? ThumbnailPath { get; set; }
    public double Duration { get; set; }
    public string Format { get; set; } = "mp3";
}
