using System.Threading.Channels;
using Microsoft.AspNetCore.Mvc;
using MixGod.Api.Models;
using MixGod.Api.Services;

namespace MixGod.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TracksController : ControllerBase
{
    private readonly IAudioStorageService _storage;
    private readonly ITrackStore _trackStore;
    private readonly ChannelWriter<AnalysisJob> _analysisQueue;

    public TracksController(
        IAudioStorageService storage,
        ITrackStore trackStore,
        ChannelWriter<AnalysisJob> analysisQueue)
    {
        _storage = storage;
        _trackStore = trackStore;
        _analysisQueue = analysisQueue;
    }

    /// <summary>
    /// Upload one or more audio files. Accepts MP3, WAV, FLAC.
    /// Files are stored to disk and queued for analysis.
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(500 * 1024 * 1024)] // 500MB for batch uploads
    public async Task<IActionResult> Upload(
        [FromForm] List<IFormFile> files,
        [FromQuery] string? projectId)
    {
        if (files == null || files.Count == 0)
            return BadRequest(new { error = "No files provided" });

        // Validate all files first
        var invalidFiles = files.Where(f => !_storage.IsValidAudioFile(f.FileName)).ToList();
        if (invalidFiles.Count > 0)
        {
            var names = string.Join(", ", invalidFiles.Select(f => f.FileName));
            return BadRequest(new { error = $"Invalid file type(s): {names}. Only .mp3, .wav, .flac are accepted." });
        }

        var createdTracks = new List<object>();

        foreach (var file in files)
        {
            var trackId = Guid.NewGuid().ToString("N")[..12];
            var filePath = await _storage.StoreAsync(file, trackId);
            var fileName = Path.GetFileNameWithoutExtension(file.FileName);

            var track = new Track
            {
                Id = trackId,
                ProjectId = projectId ?? string.Empty,
                Title = fileName,
                Filename = file.FileName,
                FilePath = filePath,
                Format = Path.GetExtension(file.FileName).TrimStart('.').ToLowerInvariant(),
                DateAdded = DateTime.UtcNow,
                AnalysisStatus = AnalysisStatus.Queued
            };

            _trackStore.Add(track);

            // Queue for analysis
            await _analysisQueue.WriteAsync(new AnalysisJob(trackId, filePath));

            createdTracks.Add(new { id = trackId, title = track.Title, status = "queued" });
        }

        return Created("", new { tracks = createdTracks });
    }

    /// <summary>
    /// List all tracks, optionally filtered by project.
    /// </summary>
    [HttpGet]
    public IActionResult List([FromQuery] string? projectId)
    {
        var tracks = _trackStore.GetAll(projectId);
        return Ok(tracks);
    }

    /// <summary>
    /// Get a single track with full metadata.
    /// </summary>
    [HttpGet("{id}")]
    public IActionResult Get(string id)
    {
        var track = _trackStore.Get(id);
        if (track == null)
            return NotFound(new { error = $"Track {id} not found" });
        return Ok(track);
    }

    /// <summary>
    /// Lightweight polling endpoint for analysis status.
    /// </summary>
    [HttpGet("{id}/status")]
    public IActionResult GetStatus(string id)
    {
        var track = _trackStore.Get(id);
        if (track == null)
            return NotFound(new { error = $"Track {id} not found" });

        return Ok(new
        {
            id = track.Id,
            status = track.AnalysisStatus.ToString().ToLowerInvariant(),
            errorMessage = track.ErrorMessage,
            bpm = track.Bpm,
            key = track.Key,
            energy = track.Energy,
            genrePrimary = track.GenrePrimary,
            duration = track.Duration
        });
    }

    /// <summary>
    /// Stream audio file for browser playback.
    /// </summary>
    [HttpGet("{id}/audio")]
    public IActionResult GetAudio(string id)
    {
        var track = _trackStore.Get(id);
        if (track == null)
            return NotFound(new { error = $"Track {id} not found" });

        try
        {
            var stream = _storage.GetStream(id);
            var contentType = track.Format switch
            {
                "mp3" => "audio/mpeg",
                "wav" => "audio/wav",
                "flac" => "audio/flac",
                _ => "application/octet-stream"
            };
            return File(stream, contentType, enableRangeProcessing: true);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { error = $"Audio file not found for track {id}" });
        }
    }

    /// <summary>
    /// Return peaks JSON for waveform visualization.
    /// </summary>
    [HttpGet("{id}/peaks")]
    public IActionResult GetPeaks(string id)
    {
        var track = _trackStore.Get(id);
        if (track == null)
            return NotFound(new { error = $"Track {id} not found" });

        if (string.IsNullOrEmpty(track.PeaksUrl))
            return NotFound(new { error = $"Peaks not yet generated for track {id}" });

        if (!System.IO.File.Exists(track.PeaksUrl))
            return NotFound(new { error = $"Peaks file not found for track {id}" });

        var json = System.IO.File.ReadAllText(track.PeaksUrl);
        return Content(json, "application/json");
    }

    /// <summary>
    /// Update track metadata (for user overrides of analysis values).
    /// </summary>
    [HttpPut("{id}")]
    public IActionResult Update(string id, [FromBody] TrackUpdateDto dto)
    {
        var track = _trackStore.Update(id, t =>
        {
            if (dto.Title != null) t.Title = dto.Title;
            if (dto.Artist != null) t.Artist = dto.Artist;
            if (dto.Bpm.HasValue) t.Bpm = dto.Bpm.Value;
            if (dto.Key != null) t.Key = dto.Key;
            if (dto.Energy.HasValue) t.Energy = dto.Energy.Value;
            if (dto.GenrePrimary != null) t.GenrePrimary = dto.GenrePrimary;
            if (dto.GenreSecondary != null) t.GenreSecondary = dto.GenreSecondary;
        });

        if (track == null)
            return NotFound(new { error = $"Track {id} not found" });

        return Ok(track);
    }

    /// <summary>
    /// Delete a track and its associated files.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var track = _trackStore.Get(id);
        if (track == null)
            return NotFound(new { error = $"Track {id} not found" });

        await _storage.DeleteAsync(id);
        _trackStore.Remove(id);

        return NoContent();
    }
}

public class TrackUpdateDto
{
    public string? Title { get; set; }
    public string? Artist { get; set; }
    public double? Bpm { get; set; }
    public string? Key { get; set; }
    public int? Energy { get; set; }
    public string? GenrePrimary { get; set; }
    public string? GenreSecondary { get; set; }
}
