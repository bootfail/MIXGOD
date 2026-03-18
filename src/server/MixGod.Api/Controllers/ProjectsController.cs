using Microsoft.AspNetCore.Mvc;
using MixGod.Api.Models;
using MixGod.Api.Services;

namespace MixGod.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectStore _projectStore;
    private readonly ITrackStore _trackStore;

    public ProjectsController(IProjectStore projectStore, ITrackStore trackStore)
    {
        _projectStore = projectStore;
        _trackStore = trackStore;
    }

    /// <summary>
    /// Create a new project.
    /// </summary>
    [HttpPost]
    public IActionResult Create([FromBody] CreateProjectDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { error = "Project name is required" });

        var project = new Project
        {
            Id = Guid.NewGuid().ToString("N")[..12],
            Name = dto.Name,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _projectStore.Add(project);

        return Created("", new { id = project.Id, name = project.Name });
    }

    /// <summary>
    /// List all projects.
    /// </summary>
    [HttpGet]
    public IActionResult List()
    {
        var projects = _projectStore.GetAll();
        return Ok(projects);
    }

    /// <summary>
    /// Get project details with track count.
    /// </summary>
    [HttpGet("{id}")]
    public IActionResult Get(string id)
    {
        var project = _projectStore.Get(id);
        if (project == null)
            return NotFound(new { error = $"Project {id} not found" });

        var trackCount = _trackStore.GetAll(id).Count();

        return Ok(new
        {
            project.Id,
            project.Name,
            project.CreatedAt,
            project.UpdatedAt,
            trackCount
        });
    }
}

public class CreateProjectDto
{
    public string Name { get; set; } = string.Empty;
}
