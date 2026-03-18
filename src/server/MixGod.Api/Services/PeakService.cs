using System.Diagnostics;
using System.Text.Json;
using NAudio.Wave;

namespace MixGod.Api.Services;

public class PeakService : IPeakService
{
    private readonly ILogger<PeakService> _logger;
    private readonly string _audiowaveformPath;
    private const int PixelsPerSecond = 20;
    private const int Bits = 8;

    public PeakService(ILogger<PeakService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _audiowaveformPath = configuration.GetValue<string>("Analysis:AudiowaveformPath") ?? "audiowaveform";
    }

    public async Task<string> GeneratePeaksAsync(string audioFilePath, string outputPath, CancellationToken ct = default)
    {
        // Try audiowaveform CLI first
        if (await TryAudiowaveform(audioFilePath, outputPath, ct))
        {
            _logger.LogInformation("Generated peaks via audiowaveform for {File}", audioFilePath);
            return outputPath;
        }

        // Fallback to NAudio peak extraction
        _logger.LogInformation("audiowaveform not available, using NAudio fallback for {File}", audioFilePath);
        return await GenerateWithNAudio(audioFilePath, outputPath, ct);
    }

    private async Task<bool> TryAudiowaveform(string audioFilePath, string outputPath, CancellationToken ct)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = _audiowaveformPath,
                Arguments = $"-i \"{audioFilePath}\" -o \"{outputPath}\" --pixels-per-second {PixelsPerSecond} --bits {Bits}",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = psi };
            process.Start();

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(60));

            await process.WaitForExitAsync(cts.Token);
            return process.ExitCode == 0 && File.Exists(outputPath);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogDebug("audiowaveform not available: {Message}", ex.Message);
            return false;
        }
    }

    private async Task<string> GenerateWithNAudio(string audioFilePath, string outputPath, CancellationToken ct)
    {
        return await Task.Run(() =>
        {
            using var waveStream = CreateWaveStream(audioFilePath);
            var sampleProvider = waveStream.ToSampleProvider();
            var sampleRate = waveStream.WaveFormat.SampleRate;
            var channels = waveStream.WaveFormat.Channels;
            var samplesPerPixel = sampleRate / PixelsPerSecond;

            var peaks = new List<int>();
            var buffer = new float[samplesPerPixel * channels];
            int read;

            while ((read = sampleProvider.Read(buffer, 0, buffer.Length)) > 0)
            {
                ct.ThrowIfCancellationRequested();

                float min = 0, max = 0;
                for (int i = 0; i < read; i += channels)
                {
                    var sample = buffer[i];
                    if (sample < min) min = sample;
                    if (sample > max) max = sample;
                }

                // Scale to 8-bit range (-128 to 127)
                peaks.Add((int)Math.Round(min * 127));
                peaks.Add((int)Math.Round(max * 127));
            }

            // Write wavesurfer.js compatible format
            var peaksData = new
            {
                version = 2,
                channels = 1,
                sample_rate = sampleRate,
                samples_per_pixel = samplesPerPixel,
                bits = Bits,
                length = peaks.Count / 2,
                data = peaks
            };

            var json = JsonSerializer.Serialize(peaksData, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });

            Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);
            File.WriteAllText(outputPath, json);
            return outputPath;
        }, ct);
    }

    private static WaveStream CreateWaveStream(string filePath)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        return ext switch
        {
            ".mp3" => new Mp3FileReader(filePath),
            ".wav" => new WaveFileReader(filePath),
            _ => new MediaFoundationReader(filePath) // FLAC and others via Windows MF
        };
    }
}
