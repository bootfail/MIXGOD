using System.Threading.Channels;
using MixGod.Api.Models;
using MixGod.Api.Services;

namespace MixGod.Api.BackgroundJobs;

/// <summary>
/// Background service that reads from the analysis channel and processes tracks.
/// Uses SemaphoreSlim(3) for bounded concurrency -- max 3 tracks analyzed at once.
/// </summary>
public class AnalysisQueueProcessor : BackgroundService
{
    private readonly ChannelReader<AnalysisJob> _channelReader;
    private readonly ITrackStore _trackStore;
    private readonly IAnalysisService _analysisService;
    private readonly IPeakService _peakService;
    private readonly ILogger<AnalysisQueueProcessor> _logger;
    private readonly SemaphoreSlim _semaphore = new(3, 3);

    public AnalysisQueueProcessor(
        ChannelReader<AnalysisJob> channelReader,
        ITrackStore trackStore,
        IAnalysisService analysisService,
        IPeakService peakService,
        ILogger<AnalysisQueueProcessor> logger)
    {
        _channelReader = channelReader;
        _trackStore = trackStore;
        _analysisService = analysisService;
        _peakService = peakService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Analysis queue processor started");

        var tasks = new List<Task>();

        try
        {
            await foreach (var job in _channelReader.ReadAllAsync(stoppingToken))
            {
                await _semaphore.WaitAsync(stoppingToken);

                var task = Task.Run(async () =>
                {
                    try
                    {
                        await ProcessJobAsync(job, stoppingToken);
                    }
                    finally
                    {
                        _semaphore.Release();
                    }
                }, stoppingToken);

                tasks.Add(task);

                // Clean up completed tasks
                tasks.RemoveAll(t => t.IsCompleted);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Analysis queue processor stopping");
        }

        // Wait for in-progress tasks to complete
        if (tasks.Count > 0)
        {
            await Task.WhenAll(tasks);
        }

        _logger.LogInformation("Analysis queue processor stopped");
    }

    private async Task ProcessJobAsync(AnalysisJob job, CancellationToken ct)
    {
        _logger.LogInformation("Processing analysis for track {TrackId}", job.TrackId);

        // Update status to analyzing
        _trackStore.Update(job.TrackId, t => t.AnalysisStatus = AnalysisStatus.Analyzing);

        try
        {
            // Run Python analysis
            var result = await _analysisService.AnalyzeAsync(job.FilePath, ct);

            // Generate waveform peaks
            var peaksPath = Path.Combine(
                Path.GetDirectoryName(job.FilePath) ?? ".",
                "peaks.json");

            string? peaksOutput = null;
            try
            {
                peaksOutput = await _peakService.GeneratePeaksAsync(job.FilePath, peaksPath, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Peak generation failed for track {TrackId}, continuing without peaks", job.TrackId);
            }

            // Update track with analysis results
            _trackStore.Update(job.TrackId, t =>
            {
                t.Bpm = result.BpmCorrected;
                t.BpmRaw = result.BpmRaw;
                t.BpmCorrected = result.BpmWasCorrected;
                t.Key = $"{result.Key} {result.KeyScale}";
                t.KeyConfidence = result.KeyConfidence;
                t.Energy = result.Energy;
                t.GenrePrimary = result.GenrePrimary;
                t.GenreSecondary = result.GenreSecondary;
                t.GenreConfidence = result.GenreConfidence;
                t.Duration = result.Duration;
                t.AnalysisConfidence = result.BeatsConfidence;
                t.PeaksUrl = peaksOutput;
                t.AnalysisStatus = AnalysisStatus.Done;
            });

            _logger.LogInformation("Analysis complete for track {TrackId}: BPM={Bpm}, Key={Key}",
                job.TrackId, result.BpmCorrected, $"{result.Key} {result.KeyScale}");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Analysis failed for track {TrackId}", job.TrackId);

            _trackStore.Update(job.TrackId, t =>
            {
                t.AnalysisStatus = AnalysisStatus.Error;
                t.ErrorMessage = ex.Message;
            });
        }
    }
}
