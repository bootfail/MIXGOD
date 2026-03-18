using System.Collections.Concurrent;
using MixGod.Api.Models;

namespace MixGod.Api.Services;

public class ProjectStore : IProjectStore
{
    private readonly ConcurrentDictionary<string, Project> _projects = new();

    public Project Add(Project project)
    {
        _projects[project.Id] = project;
        return project;
    }

    public Project? Get(string id)
    {
        return _projects.TryGetValue(id, out var project) ? project : null;
    }

    public IEnumerable<Project> GetAll()
    {
        return _projects.Values.OrderByDescending(p => p.UpdatedAt);
    }
}
