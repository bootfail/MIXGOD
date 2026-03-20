using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using MixGod.Api.Models;

namespace MixGod.Api.Services;

public class DownloadService : IDownloadService
{
    private readonly ILogger<DownloadService> _logger;
    private readonly string _ytDlpPath;
    private readonly TimeSpan _timeout;
    private bool? _isAvailableCache;

    public DownloadService(ILogger<DownloadService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _ytDlpPath = configuration.GetValue<string>("Download:YtDlpPath") ?? "yt-dlp";
        _timeout = TimeSpan.FromSeconds(configuration.GetValue<int>("Download:TimeoutSeconds", 300));
    }

    public bool IsAvailable()
    {
        if (_isAvailableCache.HasValue)
            return _isAvailableCache.Value;

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = _ytDlpPath,
                Arguments = "--version",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = psi };
            process.Start();
            process.WaitForExit(5000);
            _isAvailableCache = process.ExitCode == 0;
        }
        catch
        {
            _isAvailableCache = false;
        }

        return _isAvailableCache.Value;
    }

    public async Task<DownloadResult> GetMetadataAsync(string url, CancellationToken ct = default)
    {
        _logger.LogInformation("Fetching metadata for {Url}", url);

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(_timeout);

        var psi = new ProcessStartInfo
        {
            FileName = _ytDlpPath,
            Arguments = $"--dump-json --no-download \"{url}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8
        };

        using var process = new Process { StartInfo = psi };
        process.Start();

        var stdoutTask = process.StandardOutput.ReadToEndAsync(cts.Token);
        var stderrTask = process.StandardError.ReadToEndAsync(cts.Token);

        try
        {
            await process.WaitForExitAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            try { process.Kill(entireProcessTree: true); } catch { /* best effort */ }
            throw new TimeoutException($"Metadata fetch timed out after {_timeout.TotalSeconds}s for {url}");
        }

        var stdout = await stdoutTask;
        var stderr = await stderrTask;

        if (process.ExitCode != 0)
        {
            _logger.LogError("yt-dlp metadata failed for {Url}: {Stderr}", url, stderr);
            throw new InvalidOperationException($"yt-dlp metadata failed: {stderr}");
        }

        var doc = JsonDocument.Parse(stdout);
        var root = doc.RootElement;

        var rawTitle = root.GetProperty("title").GetString() ?? "Unknown";
        var uploader = root.TryGetProperty("uploader", out var up) ? up.GetString() ?? "" : "";
        var duration = root.TryGetProperty("duration", out var dur) ? dur.GetDouble() : 0;
        var thumbnail = root.TryGetProperty("thumbnail", out var thumb) ? thumb.GetString() : null;

        var (title, artist) = ParseTitle(rawTitle, uploader);

        return new DownloadResult
        {
            Title = title,
            Artist = artist,
            Duration = duration,
            ThumbnailPath = thumbnail // URL at this stage; actual path set after download
        };
    }

    public async Task<string> DownloadAudioAsync(string url, string outputDir, Action<int, string>? onProgress = null, CancellationToken ct = default)
    {
        _logger.LogInformation("Downloading audio from {Url} to {OutputDir}", url, outputDir);

        Directory.CreateDirectory(outputDir);

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(_timeout);

        var psi = new ProcessStartInfo
        {
            FileName = _ytDlpPath,
            Arguments = $"-x --audio-format mp3 --audio-quality 0 --newline " +
                        $"--progress-template \"download:PROGRESS|%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s\" " +
                        $"--write-thumbnail -o \"{outputDir}/audio.%(ext)s\" \"{url}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8
        };

        using var process = new Process { StartInfo = psi };
        process.Start();

        // Read stderr in background
        var stderrTask = process.StandardError.ReadToEndAsync(cts.Token);

        // Read stdout line by line for progress
        var stdoutLines = new StringBuilder();
        string? line;
        while ((line = await process.StandardOutput.ReadLineAsync(cts.Token)) != null)
        {
            stdoutLines.AppendLine(line);

            if (line.StartsWith("download:PROGRESS|") && onProgress != null)
            {
                var parts = line.Split('|');
                if (parts.Length >= 4)
                {
                    var percentStr = parts[1].Trim().TrimEnd('%');
                    if (double.TryParse(percentStr, System.Globalization.NumberStyles.Float,
                        System.Globalization.CultureInfo.InvariantCulture, out var pct))
                    {
                        var eta = parts[3].Trim();
                        onProgress((int)pct, eta);
                    }
                }
            }
        }

        try
        {
            await process.WaitForExitAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            try { process.Kill(entireProcessTree: true); } catch { /* best effort */ }
            throw new TimeoutException($"Download timed out after {_timeout.TotalSeconds}s for {url}");
        }

        var stderr = await stderrTask;

        if (process.ExitCode != 0)
        {
            _logger.LogError("yt-dlp download failed for {Url}: {Stderr}", url, stderr);
            throw new InvalidOperationException($"yt-dlp download failed: {stderr}");
        }

        // Find the downloaded mp3 file
        var mp3Files = Directory.GetFiles(outputDir, "*.mp3");
        if (mp3Files.Length == 0)
        {
            throw new FileNotFoundException($"No MP3 file found in {outputDir} after download");
        }

        _logger.LogInformation("Download complete: {FilePath}", mp3Files[0]);
        return mp3Files[0];
    }

    /// <summary>
    /// Parse raw video title into (title, artist). Strips common suffixes and splits on dash separators.
    /// </summary>
    internal static (string Title, string Artist) ParseTitle(string rawTitle, string uploaderFallback = "")
    {
        // Strip common suffixes: (Official Video), (Lyric Video), [HD], (Audio), (Official Music Video), etc.
        var cleaned = Regex.Replace(rawTitle,
            @"\s*[\(\[]\s*(Official\s+(Music\s+)?Video|Lyric\s+Video|Official\s+Audio|Audio|HD|HQ|4K|Lyrics?|Music\s+Video|Visuali[sz]er|Clip\s+Officiel)\s*[\)\]]",
            "", RegexOptions.IgnoreCase);

        cleaned = cleaned.Trim();

        // Try to split on " - " (also en-dash and em-dash)
        var dashMatch = Regex.Match(cleaned, @"^(.+?)\s*[\-\u2013\u2014]\s*(.+)$");
        if (dashMatch.Success)
        {
            var artist = dashMatch.Groups[1].Value.Trim();
            var title = dashMatch.Groups[2].Value.Trim();
            if (!string.IsNullOrWhiteSpace(artist) && !string.IsNullOrWhiteSpace(title))
            {
                return (title, artist);
            }
        }

        // No dash split found -- use full title and uploader as artist
        return (cleaned, uploaderFallback);
    }
}
