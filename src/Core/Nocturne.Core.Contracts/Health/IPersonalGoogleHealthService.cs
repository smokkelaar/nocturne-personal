using Nocturne.Core.Models.Personal;

namespace Nocturne.Core.Contracts.Health;

public interface IPersonalGoogleHealthService
{
    Task<GoogleHealthStatus> StatusAsync(CancellationToken ct);
    Task SaveAsync(GoogleHealthOptions options, Guid subject, CancellationToken ct);
    Task<GoogleHealthAuthorize> StartAsync(Guid subject, CancellationToken ct);
    Task CompleteAsync(GoogleHealthCallback callback, Guid subject, CancellationToken ct);
    Task DisconnectAsync(Guid subject, CancellationToken ct);
    Task PurgeAsync(Guid subject, CancellationToken ct);
    Task SyncAsync(bool force, CancellationToken ct);
}
