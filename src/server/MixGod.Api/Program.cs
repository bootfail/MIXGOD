using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Channels;
using MixGod.Api.BackgroundJobs;
using MixGod.Api.Models;
using MixGod.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Audio storage
builder.Services.AddSingleton<IAudioStorageService, AudioStorageService>();

// In-memory stores (Phase 1 -- no database)
builder.Services.AddSingleton<ITrackStore, TrackStore>();
builder.Services.AddSingleton<IProjectStore, ProjectStore>();

// Analysis queue channel (unbounded for batch uploads)
var analysisChannel = Channel.CreateUnbounded<AnalysisJob>(new UnboundedChannelOptions
{
    SingleReader = false,
    SingleWriter = false
});
builder.Services.AddSingleton(analysisChannel);
builder.Services.AddSingleton(svc => svc.GetRequiredService<Channel<AnalysisJob>>().Reader);
builder.Services.AddSingleton(svc => svc.GetRequiredService<Channel<AnalysisJob>>().Writer);

// Analysis services
builder.Services.AddSingleton<IAnalysisService, AnalysisService>();
builder.Services.AddSingleton<IPeakService, PeakService>();

// Background analysis queue processor
builder.Services.AddHostedService<AnalysisQueueProcessor>();

// Download queue channel (unbounded for batch URL imports)
var downloadChannel = Channel.CreateUnbounded<DownloadJob>(new UnboundedChannelOptions
{
    SingleReader = false,
    SingleWriter = false
});
builder.Services.AddSingleton(downloadChannel);
builder.Services.AddSingleton(svc => svc.GetRequiredService<Channel<DownloadJob>>().Reader);
builder.Services.AddSingleton(svc => svc.GetRequiredService<Channel<DownloadJob>>().Writer);

// Download services
builder.Services.AddSingleton<IDownloadService, DownloadService>();

// Background download queue processor
builder.Services.AddHostedService<DownloadQueueProcessor>();

// Configure max request body size for batch uploads (500MB)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 500 * 1024 * 1024;
});

var app = builder.Build();

// Ensure audio storage directory exists
var storagePath = app.Configuration.GetValue<string>("AudioStorage:Path")
    ?? Path.Combine(Directory.GetCurrentDirectory(), "audio-storage");
Directory.CreateDirectory(storagePath);

// Check yt-dlp availability (non-blocking warning)
var downloadService = app.Services.GetRequiredService<IDownloadService>();
if (downloadService.IsAvailable())
{
    app.Logger.LogInformation("yt-dlp found and available for URL imports");
}
else
{
    app.Logger.LogWarning("yt-dlp not found on PATH. URL import will not work until yt-dlp is installed. " +
        "Install via: winget install yt-dlp or pip install yt-dlp");
}

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseStaticFiles();
app.MapControllers();

// Health check endpoint
app.MapGet("/api/health", () => new { status = "ok", timestamp = DateTime.UtcNow })
    .WithName("HealthCheck");

app.Run();
