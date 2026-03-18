namespace MixGod.Api.Services;

public class AudioStorageService : IAudioStorageService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".mp3", ".wav", ".flac"
    };

    private readonly string _storagePath;

    public AudioStorageService(IConfiguration configuration)
    {
        _storagePath = configuration.GetValue<string>("AudioStorage:Path")
            ?? Path.Combine(Directory.GetCurrentDirectory(), "audio-storage");
        Directory.CreateDirectory(_storagePath);
    }

    public bool IsValidAudioFile(string fileName)
    {
        var ext = Path.GetExtension(fileName);
        return AllowedExtensions.Contains(ext);
    }

    public async Task<string> StoreAsync(IFormFile file, string trackId)
    {
        var trackDir = Path.Combine(_storagePath, trackId);
        Directory.CreateDirectory(trackDir);

        var filePath = Path.Combine(trackDir, file.FileName);
        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return filePath;
    }

    public string GetFilePath(string trackId)
    {
        var trackDir = Path.Combine(_storagePath, trackId);
        if (!Directory.Exists(trackDir))
            throw new FileNotFoundException($"Track directory not found: {trackId}");

        var files = Directory.GetFiles(trackDir).Where(f => !f.EndsWith("peaks.json")).ToArray();
        return files.Length > 0
            ? files[0]
            : throw new FileNotFoundException($"Audio file not found for track: {trackId}");
    }

    public FileStream GetStream(string trackId)
    {
        var filePath = GetFilePath(trackId);
        return new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
    }

    public async Task DeleteAsync(string trackId)
    {
        var trackDir = Path.Combine(_storagePath, trackId);
        if (Directory.Exists(trackDir))
        {
            await Task.Run(() => Directory.Delete(trackDir, recursive: true));
        }
    }
}
