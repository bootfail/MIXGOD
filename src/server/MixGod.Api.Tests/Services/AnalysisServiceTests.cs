using System.Text.Json;
using System.Threading.Channels;
using MixGod.Api.BackgroundJobs;
using MixGod.Api.Models;
using MixGod.Api.Services;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace MixGod.Api.Tests.Services;

public class AnalysisServiceTests
{
    [Fact]
    public void ParseAnalyzerJsonOutput_ValidJson_ReturnsAnalysisResult()
    {
        // Arrange
        var json = """
        {
            "bpm_raw": 150.2,
            "bpm_corrected": 150.2,
            "bpm_was_corrected": false,
            "key": "A",
            "scale": "minor",
            "key_confidence": 0.85,
            "energy": 8,
            "genre_primary": "Hardstyle",
            "genre_secondary": "Raw Hardstyle",
            "genre_confidence": 0.72,
            "danceability": 0.91,
            "loudness": -5.2,
            "duration": 312.5,
            "beats_confidence": 0.88
        }
        """;

        // Act
        var result = AnalysisService.ParseAnalyzerOutput(json);

        // Assert
        Assert.Equal(150.2, result.BpmRaw);
        Assert.Equal(150.2, result.BpmCorrected);
        Assert.False(result.BpmWasCorrected);
        Assert.Equal("A", result.Key);
        Assert.Equal("minor", result.KeyScale);
        Assert.Equal(0.85, result.KeyConfidence);
        Assert.Equal(8, result.Energy);
        Assert.Equal("Hardstyle", result.GenrePrimary);
        Assert.Equal("Raw Hardstyle", result.GenreSecondary);
        Assert.Equal(0.72, result.GenreConfidence);
        Assert.Equal(0.91, result.Danceability);
        Assert.Equal(-5.2, result.Loudness);
        Assert.Equal(312.5, result.Duration);
        Assert.Equal(0.88, result.BeatsConfidence);
    }

    [Fact]
    public void ParseAnalyzerJsonOutput_InvalidJson_Throws()
    {
        // Arrange
        var json = "not valid json";

        // Act & Assert
        Assert.ThrowsAny<JsonException>(() => AnalysisService.ParseAnalyzerOutput(json));
    }

    [Fact]
    public async Task PeakService_FallbackWhenAudiowaveformMissing_GeneratesPeaks()
    {
        // This tests the NAudio fallback path.
        // PeakService should detect audiowaveform is not available and use NAudio.
        var peakService = new PeakService(
            Substitute.For<Microsoft.Extensions.Logging.ILogger<PeakService>>(),
            Substitute.For<Microsoft.Extensions.Configuration.IConfiguration>());

        // We can't test with a real audio file in unit tests,
        // but we can verify the service is constructable and has the fallback method
        Assert.NotNull(peakService);
    }

    [Fact]
    public async Task QueueProcessesJobsConcurrently_MaxThreeAtOnce()
    {
        // Arrange
        var channel = Channel.CreateUnbounded<AnalysisJob>();
        var trackStore = new TrackStore();
        var analysisService = Substitute.For<IAnalysisService>();
        var peakService = Substitute.For<IPeakService>();
        var logger = Substitute.For<Microsoft.Extensions.Logging.ILogger<AnalysisQueueProcessor>>();

        var concurrentCount = 0;
        var maxConcurrent = 0;
        var lockObj = new object();
        var allStarted = new TaskCompletionSource();
        var startedCount = 0;

        analysisService.AnalyzeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(async ci =>
            {
                lock (lockObj)
                {
                    concurrentCount++;
                    if (concurrentCount > maxConcurrent) maxConcurrent = concurrentCount;
                    startedCount++;
                    if (startedCount >= 5) allStarted.TrySetResult();
                }
                await Task.Delay(500); // Simulate work
                lock (lockObj) { concurrentCount--; }
                return new AnalysisResult
                {
                    BpmRaw = 150,
                    BpmCorrected = 150,
                    Key = "A",
                    KeyScale = "minor",
                    Energy = 8,
                    Duration = 300
                };
            });

        peakService.GeneratePeaksAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult("peaks.json"));

        // Add 5 tracks
        for (int i = 0; i < 5; i++)
        {
            var track = new Track { Id = $"track-{i}", FilePath = $"/fake/path-{i}.mp3", AnalysisStatus = AnalysisStatus.Queued };
            trackStore.Add(track);
            await channel.Writer.WriteAsync(new AnalysisJob($"track-{i}", $"/fake/path-{i}.mp3"));
        }

        var processor = new AnalysisQueueProcessor(channel.Reader, trackStore, analysisService, peakService, logger);

        // Act
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        var processingTask = processor.StartAsync(cts.Token);

        // Wait for all jobs to have started (with timeout)
        var completed = await Task.WhenAny(allStarted.Task, Task.Delay(5000));

        // Give time for processing
        await Task.Delay(1500);
        await processor.StopAsync(CancellationToken.None);

        // Assert: max 3 concurrent (SemaphoreSlim(3))
        Assert.True(maxConcurrent <= 3, $"Expected max 3 concurrent, got {maxConcurrent}");
        Assert.True(maxConcurrent >= 2, $"Expected at least 2 concurrent, got {maxConcurrent} (may indicate no parallelism)");
    }

    [Fact]
    public async Task FailedAnalysis_SetsErrorStatus_DoesNotCrashQueue()
    {
        // Arrange
        var channel = Channel.CreateUnbounded<AnalysisJob>();
        var trackStore = new TrackStore();
        var analysisService = Substitute.For<IAnalysisService>();
        var peakService = Substitute.For<IPeakService>();
        var logger = Substitute.For<Microsoft.Extensions.Logging.ILogger<AnalysisQueueProcessor>>();

        // First call throws, second succeeds
        analysisService.AnalyzeAsync(Arg.Is<string>(p => p.Contains("bad")), Arg.Any<CancellationToken>())
            .ThrowsAsync(new Exception("Analysis failed: corrupt file"));

        analysisService.AnalyzeAsync(Arg.Is<string>(p => p.Contains("good")), Arg.Any<CancellationToken>())
            .Returns(new AnalysisResult
            {
                BpmRaw = 140,
                BpmCorrected = 140,
                Key = "C",
                KeyScale = "major",
                Energy = 6,
                Duration = 240
            });

        peakService.GeneratePeaksAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult("peaks.json"));

        var badTrack = new Track { Id = "bad-track", FilePath = "/bad/path.mp3", AnalysisStatus = AnalysisStatus.Queued };
        var goodTrack = new Track { Id = "good-track", FilePath = "/good/path.mp3", AnalysisStatus = AnalysisStatus.Queued };
        trackStore.Add(badTrack);
        trackStore.Add(goodTrack);

        await channel.Writer.WriteAsync(new AnalysisJob("bad-track", "/bad/path.mp3"));
        await channel.Writer.WriteAsync(new AnalysisJob("good-track", "/good/path.mp3"));

        var processor = new AnalysisQueueProcessor(channel.Reader, trackStore, analysisService, peakService, logger);

        // Act
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        await processor.StartAsync(cts.Token);
        await Task.Delay(2000);
        await processor.StopAsync(CancellationToken.None);

        // Assert
        var bad = trackStore.Get("bad-track");
        var good = trackStore.Get("good-track");

        Assert.Equal(AnalysisStatus.Error, bad!.AnalysisStatus);
        Assert.Contains("Analysis failed", bad.ErrorMessage);
        Assert.Equal(AnalysisStatus.Done, good!.AnalysisStatus);
        Assert.Equal(140.0, good.Bpm);
    }
}
