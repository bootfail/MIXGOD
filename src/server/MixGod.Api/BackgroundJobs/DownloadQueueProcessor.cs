using System.Collections.Concurrent;
using System.Threading.Channels;
using MixGod.Api.Models;
using MixGod.Api.Services;

namespace MixGod.Api.BackgroundJobs;

/// <summary>
/// Background service that reads from the download channel and processes URL imports.
/// Uses SemaphoreSlim(2) for bounded concurrency -- max 2 downloads at once (bandwidth constraint).
/// After download completes, chains to the analysis queue.
/// </summary>
public class DownloadQueueProcessor : BackgroundService
{
    private static readonly ConcurrentDictionary<string, (int Percent, string Eta)> _progress = new();

    private readonly ChannelReader<DownloadJob> _channelReader;
    private readonly ITrackStore _trackStore;
    private readonly IDownloadService _downloadService;
    private readonly IAudioStorageService _audioStorage;
    private readonly ChannelWriter<AnalysisJob> _analysisQueue;
    private readonly ILogger<DownloadQueueProcessor> _logger;
    private readonly SemaphoreSlim _semaphore = new(2, 2);

    public DownloadQueueProcessor(
        ChannelReader<DownloadJob> channelReader,
        ITrackStore trackStore,
        IDownloadService downloadService,
        IAudioStorageService audioStorage,
        ChannelWriter<AnalysisJob> analysisQueue,
        ILogger<DownloadQueueProcessor> logger)
    {
        _channelReader = channelReader;
        _trackStore = trackStore;
        _downloadService = downloadService;
        _audioStorage = audioStorage;
        _analysisQueue = analysisQueue;
        _logger = logger;
    }

    /// <summary>
    /// Get download progress for a track. Returns null if no progress tracked.
    /// </summary>
    public static (int Percent, string Eta)? GetProgress(string trackId)
    {
        return _progress.TryGetValue(trackId, out var progress) ? progress : null;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Download queue processor started");

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
            _logger.LogInformation("Download queue processor stopping");
        }

        // Wait for in-progress tasks to complete
        if (tasks.Count > 0)
        {
            await Task.WhenAll(tasks);
        }

        _logger.LogInformation("Download queue processor stopped");
    }

    private async Task ProcessJobAsync(DownloadJob job, CancellationToken ct)
    {
        _logger.LogInformation("Processing download for track {TrackId} from {Url}", job.TrackId, job.Url);

        // Update status to downloading
        _trackStore.Update(job.TrackId, t => t.DownloadStatus = DownloadStatus.Downloading);

        try
        {
            // Create output directory
            var outputDir = Path.Combine(
                Directory.GetCurrentDirectory(), "audio-storage", job.TrackId);
            Directory.CreateDirectory(outputDir);

            // Fetch metadata first
            var metadata = await _downloadService.GetMetadataAsync(job.Url, ct);
            _trackStore.Update(job.TrackId, t =>
            {
                t.Title = metadata.Title;
                t.Artist = metadata.Artist;
                t.Duration = metadata.Duration;
            });

            // Download audio with progress tracking
            var filePath = await _downloadService.DownloadAudioAsync(
                job.Url, outputDir,
                onProgress: (percent, eta) =>
                {
                    _progress[job.TrackId] = (percent, eta);
                },
                ct);

            // Find thumbnail file if it exists
            string? thumbnailPath = null;
            var thumbnailFiles = Directory.GetFiles(outputDir)
                .Where(f =>
                {
                    var ext = Path.GetExtension(f).ToLowerInvariant();
                    return ext is ".jpg" or ".jpeg" or ".png" or ".webp";
                })
                .ToArray();

            if (thumbnailFiles.Length > 0)
            {
                thumbnailPath = thumbnailFiles[0];
            }

            // Update track with download results
            _trackStore.Update(job.TrackId, t =>
            {
                t.FilePath = filePath;
                t.Filename = Path.GetFileName(filePath);
                t.Format = "mp3";
                t.DownloadStatus = DownloadStatus.Done;
                t.ThumbnailPath = thumbnailPath;
            });

            // Clean up progress tracking
            _progress.TryRemove(job.TrackId, out _);

            _logger.LogInformation("Download complete for track {TrackId}, queueing for analysis", job.TrackId);

            // Chain to analysis queue
            await _analysisQueue.WriteAsync(new AnalysisJob(job.TrackId, filePath), ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Download failed for track {TrackId}", job.TrackId);

            var friendlyMessage = GetFriendlyErrorMessage(ex.Message);

            _trackStore.Update(job.TrackId, t =>
            {
                t.DownloadStatus = DownloadStatus.Error;
                t.ErrorMessage = friendlyMessage;
            });

            // Clean up progress tracking
            _progress.TryRemove(job.TrackId, out _);
        }
    }

    /// <summary>
    /// Parse yt-dlp error messages into user-friendly descriptions.
    /// </summary>
    private static string GetFriendlyErrorMessage(string rawMessage)
    {
        if (rawMessage.Contains("Video unavailable", StringComparison.OrdinalIgnoreCase))
            return "This video is unavailable. It may have been removed or made private.";

        if (rawMessage.Contains("Private video", StringComparison.OrdinalIgnoreCase))
            return "This video is private and cannot be downloaded.";

        if (rawMessage.Contains("not available in your country", StringComparison.OrdinalIgnoreCase))
            return "This video is not available in your region.";

        if (rawMessage.Contains("Sign in to confirm your age", StringComparison.OrdinalIgnoreCase))
            return "This video requires age verification and cannot be downloaded.";

        if (rawMessage.Contains("Incomplete data", StringComparison.OrdinalIgnoreCase))
            return "Download failed due to incomplete data. The video may be too long or unavailable.";

        return $"Download failed: {rawMessage}";
    }
}
