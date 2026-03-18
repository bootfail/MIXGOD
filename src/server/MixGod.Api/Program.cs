using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Configure services
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

builder.Services.Configure<JsonSerializerOptions>(options =>
{
    options.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseStaticFiles();

// Health check endpoint
app.MapGet("/api/health", () => new { status = "ok", timestamp = DateTime.UtcNow })
    .WithName("HealthCheck");

app.Run();
