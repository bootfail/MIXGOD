using MixGod.Api.Models;

namespace MixGod.Api.Services;

/// <summary>
/// In-memory track storage backed by ConcurrentDictionary.
/// No database in Phase 1 -- persistence via project file import/export.
/// </summary>
public interface ITrackStore
{
    Track Add(Track track);
    Track? Get(string id);
    IEnumerable<Track> GetAll(string? projectId = null);
    Track? Update(string id, Action<Track> mutate);
    bool Remove(string id);
}
