using System.Threading.Channels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MixGod.Api.Controllers;
using MixGod.Api.Models;
using MixGod.Api.Services;
using NSubstitute;

namespace MixGod.Api.Tests.Controllers;

public class TracksControllerTests
{
    private readonly IAudioStorageService _storage = Substitute.For<IAudioStorageService>();
    private readonly ITrackStore _trackStore = Substitute.For<ITrackStore>();
    private readonly Channel<AnalysisJob> _channel = Channel.CreateUnbounded<AnalysisJob>();

    private TracksController CreateController()
    {
        return new TracksController(_storage, _trackStore, _channel.Writer);
    }

    private static IFormFile CreateMockFile(string fileName, long size = 1024)
    {
        var file = Substitute.For<IFormFile>();
        file.FileName.Returns(fileName);
        file.Length.Returns(size);
        file.ContentType.Returns(fileName.EndsWith(".mp3") ? "audio/mpeg" :
                                  fileName.EndsWith(".wav") ? "audio/wav" :
                                  fileName.EndsWith(".flac") ? "audio/flac" : "application/octet-stream");
        file.OpenReadStream().Returns(new MemoryStream(new byte[size]));
        return file;
    }

    [Fact]
    public async Task Upload_SingleFile_Returns201WithTrackId()
    {
        // Arrange
        var file = CreateMockFile("track.mp3");
        _storage.IsValidAudioFile("track.mp3").Returns(true);
        _storage.StoreAsync(file, Arg.Any<string>()).Returns("stored-path");
        _trackStore.Add(Arg.Any<Track>()).Returns(ci => ci.Arg<Track>());

        // Act
        var result = await CreateController().Upload(new List<IFormFile> { file }, null);

        // Assert
        var created = Assert.IsType<CreatedResult>(result);
        var body = created.Value as dynamic;
        Assert.NotNull(body);
    }

    [Fact]
    public async Task Upload_RejectsNonAudioFile()
    {
        // Arrange
        var file = CreateMockFile("document.pdf");
        _storage.IsValidAudioFile("document.pdf").Returns(false);

        // Act
        var result = await CreateController().Upload(new List<IFormFile> { file }, null);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("Invalid", badRequest.Value?.ToString() ?? "");
    }

    [Fact]
    public async Task Upload_MultipleFiles_CreatesMultipleTracks()
    {
        // Arrange
        var files = new List<IFormFile>
        {
            CreateMockFile("track1.mp3"),
            CreateMockFile("track2.wav"),
            CreateMockFile("track3.flac")
        };

        _storage.IsValidAudioFile(Arg.Any<string>()).Returns(true);
        _storage.StoreAsync(Arg.Any<IFormFile>(), Arg.Any<string>()).Returns("stored-path");
        _trackStore.Add(Arg.Any<Track>()).Returns(ci => ci.Arg<Track>());

        // Act
        var result = await CreateController().Upload(files, null);

        // Assert
        var created = Assert.IsType<CreatedResult>(result);
        _trackStore.Received(3).Add(Arg.Any<Track>());
    }

    [Fact]
    public void GetTrack_ReturnsTrackMetadata()
    {
        // Arrange
        var track = new Track
        {
            Id = "test-id",
            Title = "Test Track",
            Artist = "Test Artist",
            AnalysisStatus = AnalysisStatus.Done
        };
        _trackStore.Get("test-id").Returns(track);

        // Act
        var result = CreateController().Get("test-id");

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsType<Track>(ok.Value);
        Assert.Equal("Test Track", returned.Title);
    }

    [Fact]
    public async Task DeleteTrack_RemovesTrackAndFile()
    {
        // Arrange
        var track = new Track { Id = "del-id", FilePath = "/path/to/file" };
        _trackStore.Get("del-id").Returns(track);
        _trackStore.Remove("del-id").Returns(true);

        // Act
        var result = await CreateController().Delete("del-id");

        // Assert
        Assert.IsType<NoContentResult>(result);
        await _storage.Received(1).DeleteAsync("del-id");
        _trackStore.Received(1).Remove("del-id");
    }
}
