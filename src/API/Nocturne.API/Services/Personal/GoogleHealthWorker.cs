using Nocturne.Core.Contracts.Multitenancy;
using Nocturne.Core.Contracts.Health;

namespace Nocturne.API.Services.Personal;

public sealed class GoogleHealthWorker(IServiceScopeFactory scopes, ILogger<GoogleHealthWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var listing = scopes.CreateScope();
                var tenants = await listing.ServiceProvider.GetRequiredService<ITenantService>().GetAllAsync(stoppingToken);
                foreach (var tenant in tenants.Where(t => t.IsActive))
                {
                    try
                    {
                        using var scope = scopes.CreateScope();
                        scope.ServiceProvider.GetRequiredService<ITenantAccessor>().SetTenant(new(tenant.Id, tenant.Slug, tenant.DisplayName, true, false));
                        await scope.ServiceProvider.GetRequiredService<IPersonalGoogleHealthService>().SyncAsync(false, stoppingToken);
                    }
                    catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { return; }
                    catch (Exception) { logger.LogWarning("Personal Google Health sync failed; details are not logged to protect health data and credentials"); }
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { return; }
            catch (Exception) { logger.LogWarning("Personal Google Health scheduler could not enumerate tenants"); }
        }
    }
}
