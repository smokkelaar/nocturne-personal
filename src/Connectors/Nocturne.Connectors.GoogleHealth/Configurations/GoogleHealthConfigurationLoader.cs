using Nocturne.Connectors.Core.Interfaces;
using Nocturne.Connectors.Core.Services;

namespace Nocturne.Connectors.GoogleHealth.Configurations;

/// <summary>
/// Reports every tenant's connector as disabled while the instance has no Google client, so
/// scheduled polling skips it quietly instead of failing each tenant's sync and marking it
/// unhealthy for something only the operator can fix.
/// </summary>
public sealed class GoogleHealthConfigurationLoader(
    ConnectorConfigurationLoader<GoogleHealthConnectorConfiguration> inner,
    IGoogleHealthPlatformSource platform)
    : IConnectorConfigurationLoader<GoogleHealthConnectorConfiguration>
{
    public async Task<GoogleHealthConnectorConfiguration> LoadForTenantAsync(CancellationToken ct)
    {
        var configuration = await inner.LoadForTenantAsync(ct);
        if (!(await platform.GetAsync(ct)).IsConfigured) configuration.Enabled = false;
        return configuration;
    }
}
