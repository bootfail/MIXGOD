using System.Collections.Concurrent;
using MixGod.Api.Models;

namespace MixGod.Api.Services;

/// <summary>
/// In-memory track storage. Phase 1 uses no database --
/// persistence is handled via .mixgod project file export/import.
/// </summary>
public class TrackStore : ITrackStore
{
    private readonly ConcurrentDictionary<string, Track> _tracks = new();

    public Track Add(Track track)
    {
        _tracks[track.Id] = track;
        return track;
    }

    public Track? Get(string id)
    {
        return _tracks.TryGetValue(id, out var track) ? track : null;
    }

    public IEnumerable<Track> GetAll(string? projectId = null)
    {
        var tracks = _tracks.Values.AsEnumerable();
        if (!string.IsNullOrEmpty(projectId))
            tracks = tracks.Where(t => t.ProjectId == projectId);
        return tracks.OrderByDescending(t => t.DateAdded);
    }

    public Track? Update(string id, Action<Track> mutate)
    {
        if (!_tracks.TryGetValue(id, out var track))
            return null;

        mutate(track);
        return track;
    }

    public bool Remove(string id)
    {
        return _tracks.TryRemove(id, out _);
    }
}
