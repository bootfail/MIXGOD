using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Channels;
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
