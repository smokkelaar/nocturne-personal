using Microsoft.Extensions.Options;

namespace Nocturne.Connectors.GoogleHealth.Configurations;

public interface IGoogleHealthPlatformSource
{
    Task<GoogleHealthPlatformOptions> GetAsync(CancellationToken ct = default);
}

public sealed class ConfigurationGoogleHealthPlatformSource(IOptions<GoogleHealthPlatformOptions> options)
    : IGoogleHealthPlatformSource
{
    public Task<GoogleHealthPlatformOptions> GetAsync(CancellationToken ct = default) =>
        Task.FromResult(options.Value);
}
