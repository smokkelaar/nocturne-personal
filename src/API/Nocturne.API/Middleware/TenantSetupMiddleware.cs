using Microsoft.EntityFrameworkCore;
using Nocturne.API.Authorization;
using Nocturne.Core.Contracts.Multitenancy;
using Nocturne.Infrastructure.Data.Services;
using Nocturne.Infrastructure.Data.Extensions;

namespace Nocturne.API.Middleware;

/// <summary>
/// Middleware that returns 503 for freshly provisioned tenants (no passkey
/// credentials) or tenants in recovery mode (orphaned subjects with no
/// passkey and no OIDC binding). Allows passkey setup, admin, and metadata
/// endpoints through so setup/recovery flows can complete. Trusted instance-key
/// service requests also bypass the gate (see <see cref="IInstanceKeyValidator"/>)
/// so automation can configure a tenant before a human owner registers a passkey.
/// When no tenant is resolved (e.g. tenantless cross-tenant paths, or zero-tenant setup),
/// the middleware passes through.
/// </summary>
/// <remarks>
/// Must run after <see cref="Multitenancy.TenantResolutionMiddleware"/>, which supplies the tenant,
/// and after <c>UseRouting</c>, which supplies the endpoint whose
/// <see cref="AllowDuringSetupAttribute"/> bypasses both the setup and the recovery check.
/// </remarks>
/// <seealso cref="AllowDuringSetupAttribute"/>
/// <seealso cref="Multitenancy.TenantResolutionMiddleware"/>
public class TenantSetupMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantSetupMiddleware> _logger;

    /// <summary>
    /// Creates a new instance of <see cref="TenantSetupMiddleware"/>.
    /// </summary>
    /// <param name="next">The next middleware in the pipeline.</param>
    /// <param name="logger">Logger for setup/recovery diagnostics.</param>
    public TenantSetupMiddleware(
        RequestDelegate next,
        ILogger<TenantSetupMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>
    /// Checks whether the resolved tenant requires initial setup or is in recovery mode,
    /// returning 503 if API traffic should be blocked.
    /// </summary>
    /// <param name="context">The current HTTP context.</param>
    /// <param name="tenantAccessor">Accessor for the resolved tenant identity.</param>
    /// <param name="dbFactory">Factory for the tenant-pinned context the checks below run on.</param>
    /// <param name="instanceKeyValidator">Validator used to let trusted instance-key callers bypass the setup gate.</param>
    /// <returns>A task that completes when the middleware has finished processing.</returns>
    public async Task InvokeAsync(
        HttpContext context,
        ITenantAccessor tenantAccessor,
        INocturneDbContextFactory dbFactory,
        IInstanceKeyValidator instanceKeyValidator)
    {
        // Only check when a tenant has been resolved
        if (!tenantAccessor.IsResolved)
        {
            await _next(context);
            return;
        }

        // Demo tenants bypass setup requirements — they have no owner credentials by design
        if (tenantAccessor.Context?.IsDemo == true)
        {
            await _next(context);
            return;
        }

        // Endpoints marked [AllowDuringSetup] bypass both the setup check and the
        // recovery check — these are the bootstrap endpoints (passkey/TOTP setup,
        // OIDC bootstrap login, admin provisioning, metadata).
        var endpoint = context.GetEndpoint();
        if (endpoint?.Metadata.GetMetadata<AllowDuringSetupAttribute>() is not null)
        {
            await _next(context);
            return;
        }

        // A valid instance-key service request (trusted in-cluster automation — a
        // provisioner or a headless setup agent) bypasses the setup/recovery gate.
        // The instance key is the highest-trust service credential and already grants
        // platform-admin once setup completes; letting it through here lets automation
        // stand up a tenant (connectors, settings, seed data) before a human owner has
        // registered a passkey. Untrusted tenant traffic still gets 503 until then.
        // A bare key without the X-Instance-Service marker does NOT qualify (see
        // IInstanceKeyValidator), so a key accidentally forwarded onto a browser
        // request cannot slip past the gate.
        if (instanceKeyValidator.Classify(context) == InstanceKeyRequestKind.Valid)
        {
            await _next(context);
            return;
        }

        // Only block API paths; static files and non-API endpoints pass through.
        var path = context.Request.Path.Value ?? "";
        if (!path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // Evaluated in a scope of its own so the extra context is disposed before the rest of the
        // pipeline runs, rather than being held open for the whole downstream request.
        switch (await EvaluateGateAsync(dbFactory, tenantAccessor.TenantId, path, context.RequestAborted))
        {
            case SetupGate.SetupRequired:
                context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "setup_required",
                    message = "Initial setup required. Please register a passkey to secure your account.",
                    setupRequired = true,
                    recoveryMode = false,
                });
                return;

            case SetupGate.RecoveryMode:
                context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "recovery_mode_active",
                    message = "Instance is in recovery mode. Please register a passkey or authenticator app to continue.",
                    setupRequired = false,
                    recoveryMode = true,
                });
                return;
        }

        await _next(context);
    }

    /// <summary>What the setup and recovery checks decided for this tenant.</summary>
    private enum SetupGate
    {
        /// <summary>The tenant is configured and has no locked-out accounts.</summary>
        Pass,

        /// <summary>No member holds a credential yet — first-run setup has not completed.</summary>
        SetupRequired,

        /// <summary>A member cannot sign in at all, so the recovery flow has to be reachable.</summary>
        RecoveryMode,
    }

    /// <summary>
    /// Runs the setup and recovery checks and logs the diagnostics for a refusal.
    /// </summary>
    /// <remarks>
    /// System-pinned (<see cref="INocturneDbContextFactory.CreateSystemPinnedAsync"/>): the gate runs on public-share requests
    /// too. Scoped to this method so the context is released before the pipeline continues.
    /// </remarks>
    private async Task<SetupGate> EvaluateGateAsync(
        INocturneDbContextFactory dbFactory,
        Guid tenantId,
        string path,
        CancellationToken ct)
    {
        await using var db = await dbFactory.CreateSystemPinnedAsync(tenantId, ct);

        // Every API request passes through here, so both checks are one statement: no member row
        // means no member can hold a credential, and the counts below are read only to log a refusal.
        // Credentials and OIDC identities are subject-scoped (not tenant-scoped), so the checks join
        // through TenantMembers.
        var members = db.TenantMembers.Where(m => m.TenantId == tenantId);
        var orphans = db.OrphanedSubjectsOf(tenantId);
        var gate = await members
            .Take(1)
            .Select(_ => new
            {
                HasCredentials = members.Any(m =>
                    db.PasskeyCredentials.Any(c => c.SubjectId == m.SubjectId) ||
                    db.WorkingOidcIdentities().Any(i => i.SubjectId == m.SubjectId)),
                HasOrphans = orphans.Any(),
            })
            .FirstOrDefaultAsync(ct);

        if (gate is not { HasCredentials: true })
        {
            var memberCount = gate is null ? 0 : await members.CountAsync(ct);
            var passkeyCount = memberCount > 0
                ? await db.TenantMembers
                    .Where(m => m.TenantId == tenantId)
                    .SelectMany(m => db.PasskeyCredentials.Where(c => c.SubjectId == m.SubjectId))
                    .CountAsync(ct)
                : 0;
            var oidcCount = memberCount > 0
                ? await db.TenantMembers
                    .Where(m => m.TenantId == tenantId)
                    .SelectMany(m => db.WorkingOidcIdentities().Where(i => i.SubjectId == m.SubjectId))
                    .CountAsync(ct)
                : 0;

            _logger.LogWarning(
                "Tenant {TenantId} setup check failed — returning 503 setup_required. " +
                "Path={Path}, MemberCount={MemberCount}, PasskeyCount={PasskeyCount}, OidcCount={OidcCount}, " +
                "DbContextTenantId={DbContextTenantId}",
                tenantId, path, memberCount, passkeyCount, oidcCount, db.TenantId);

            return SetupGate.SetupRequired;
        }

        if (gate.HasOrphans)
        {
            var orphanedSubjects = await orphans
                .Select(s => new { s.Id, s.Name, s.Username })
                .ToListAsync(ct);

            _logger.LogWarning(
                "Tenant {TenantId} has orphaned subjects, returning 503 recovery_mode. " +
                "Path={Path}, OrphanedSubjects={@OrphanedSubjects}",
                tenantId, path, orphanedSubjects);

            return SetupGate.RecoveryMode;
        }

        return SetupGate.Pass;
    }
}