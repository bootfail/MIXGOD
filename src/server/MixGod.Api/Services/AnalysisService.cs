using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using MixGod.Api.Models;

namespace MixGod.Api.Services;

public class AnalysisService : IAnalysisService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        NumberHandling = JsonNumberHandling.AllowReadingFromString
    };

    private readonly ILogger<AnalysisService> _logger;
    private readonly string _pythonPath;
    private readonly string _analyzerPath;
    private readonly TimeSpan _timeout;

    public AnalysisService(ILogger<AnalysisService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _pythonPath = configuration.GetValue<string>("Analysis:PythonPath") ?? "python";
        _analyzerPath = configuration.GetValue<string>("Analysis:AnalyzerPath")
            ?? Path.Combine(Directory.GetCurrentDirectory(), "../../analysis/analyzer.py");
        _timeout = TimeSpan.FromSeconds(configuration.GetValue<int>("Analysis:TimeoutSeconds", 120));
    }

    public async Task<AnalysisResult> AnalyzeAsync(string filePath, CancellationToken ct = default)
    {
        var absolutePath = Path.GetFullPath(filePath);
        var analyzerAbsPath = Path.GetFullPath(_analyzerPath);

        _logger.LogInformation("Starting analysis of {FilePath} with {Analyzer}", absolutePath, analyzerAbsPath);

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(_timeout);

        var psi = new ProcessStartInfo
        {
            FileName = _pythonPath,
            Arguments = $"\"{analyzerAbsPath}\" \"{absolutePath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
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
            throw new TimeoutException($"Analysis timed out after {_timeout.TotalSeconds}s for {filePath}");
        }

        var stdout = await stdoutTask;
        var stderr = await stderrTask;

        if (process.ExitCode != 0)
        {
            _logger.LogError("Analyzer failed with exit code {ExitCode}: {Stderr}", process.ExitCode, stderr);
            throw new InvalidOperationException($"Analyzer failed (exit {process.ExitCode}): {stderr}");
        }

        _logger.LogInformation("Analysis complete for {FilePath}", filePath);
        return ParseAnalyzerOutput(stdout);
    }

    /// <summary>
    /// Parse the JSON output from the Python analyzer.py script.
    /// Public static for testability.
    /// </summary>
    public static AnalysisResult ParseAnalyzerOutput(string json)
    {
        var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        return new AnalysisResult
        {
            BpmRaw = root.GetProperty("bpm_raw").GetDouble(),
            BpmCorrected = root.GetProperty("bpm_corrected").GetDouble(),
            BpmWasCorrected = root.GetProperty("bpm_was_corrected").GetBoolean(),
            Key = root.GetProperty("key").GetString() ?? string.Empty,
            KeyScale = root.GetProperty("scale").GetString() ?? string.Empty,
            KeyConfidence = root.GetProperty("key_confidence").GetDouble(),
            Energy = root.GetProperty("energy").GetInt32(),
            GenrePrimary = root.GetProperty("genre_primary").GetString() ?? string.Empty,
            GenreSecondary = root.GetProperty("genre_secondary").GetString(),
            GenreConfidence = root.GetProperty("genre_confidence").GetDouble(),
            Danceability = root.GetProperty("danceability").GetDouble(),
            Loudness = root.GetProperty("loudness").GetDouble(),
            Duration = root.GetProperty("duration").GetDouble(),
            BeatsConfidence = root.GetProperty("beats_confidence").GetDouble()
        };
    }
}
