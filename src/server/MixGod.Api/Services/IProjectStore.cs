using MixGod.Api.Models;

namespace MixGod.Api.Services;

public interface IProjectStore
{
    Project Add(Project project);
    Project? Get(string id);
    IEnumerable<Project> GetAll();
}
