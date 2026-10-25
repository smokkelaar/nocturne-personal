using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Nocturne.Connectors.GoogleHealth.Configurations;
using Nocturne.Core.Contracts.Auth;
using Nocturne.Infrastructure.Data.Entities;
using Nocturne.Infrastructure.Data.Services;

namespace Nocturne.API.Services.Health.GoogleHealth;

public sealed class GoogleHealthAdminField
{
    public bool EnvironmentConfigured { get; init; }
    public bool DeploymentConfigured { get; init; }
    public bool AdminConfigured { get; init; }
    public bool ValuesDiffer { get; init; }
    public string Source { get; init; } = "missing";
    public string? DeploymentValue { get; init; }
    public string? AdminValue { get; init; }
    public string? EffectiveValue { get; init; }
}

public sealed class GoogleHealthAdminStatus
{
    public bool OverrideEnabled { get; init; }
    public bool AdminSettingsStored { get; init; }
    public bool IsConfigured { get; init; }
    public bool EncryptionAvailable { get; init; }
    public GoogleHealthAdminField ClientId { get; init; } = new();
    public GoogleHealthAdminField ClientSecret { get; init; } = new();
    public GoogleHealthAdminField RedirectUri { get; init; } = new();
}

public sealed class SaveGoogleHealthAdminRequest
{
    public bool OverrideEnabled { get; init; }
    [MaxLength(256)] public string? ClientId { get; init; }
    [MaxLength(4096)] public string? ClientSecret { get; init; }
    [MaxLength(2048)] public string? RedirectUri { get; init; }
    [MaxLength(3)] public string[] UseDeploymentFields { get; init; } = [];
}

public sealed class GoogleHealthAdminSaveResult
{
    public Dictionary<string, string> Errors { get; init; } = [];
    public GoogleHealthAdminStatus? Settings { get; init; }
}

public sealed class GoogleHealthAdminSettings(
    INocturneDbContextFactory contexts,
    ISecretEncryptionService encryption,
    IOptions<GoogleHealthPlatformOptions> defaults,
    IConfiguration configuration) : IGoogleHealthPlatformSource
{
    public const string Category = "google-health";
    private static readonly string[] Names = ["clientId", "clientSecret", "redirectUri"];
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private async Task<(PlatformSettingsEntity? Row, Dictionary<string, string> Fields)> ReadAsync(CancellationToken ct, bool activeOnly = false)
    {
        await using var db = await contexts.CreatePlatformAsync(ct);
        var row = await db.PlatformSettings.AsNoTracking().SingleOrDefaultAsync(x => x.Category == Category && (!activeOnly || x.Enabled), ct);
        if (row is null) return (null, []);
        // An unreadable override must fail closed, not silently switch the instance's OAuth identity.
        if (!encryption.IsConfigured) throw new InvalidOperationException("instance_encryption_unavailable");
        var encrypted = JsonSerializer.Deserialize<Dictionary<string, string>>(row.EncryptedJson, Json) ?? [];
        return (row, encryption.DecryptSecrets(encrypted));
    }

    public static GoogleHealthPlatformOptions Resolve(GoogleHealthPlatformOptions deployment, bool enabled,
        IReadOnlyDictionary<string, string> fields)
    {
        return new()
        {
            ClientId = Pick("clientId", deployment.ClientId),
            ClientSecret = Pick("clientSecret", deployment.ClientSecret),
            RedirectUri = Pick("redirectUri", deployment.RedirectUri),
        };
        string Pick(string key, string fallback) => enabled && fields.TryGetValue(key, out var value) &&
            !string.IsNullOrWhiteSpace(value) ? value : fallback;
    }

    public async Task<GoogleHealthPlatformOptions> GetAsync(CancellationToken ct = default)
    {
        var (row, fields) = await ReadAsync(ct, activeOnly: true);
        return Resolve(defaults.Value, row?.Enabled == true, fields);
    }

    public async Task<GoogleHealthAdminStatus> StatusAsync(CancellationToken ct = default)
    {
        var (row, fields) = await ReadAsync(ct);
        return Status(row, fields);
    }

    private GoogleHealthAdminStatus Status(PlatformSettingsEntity? row, Dictionary<string, string> fields)
    {
        var enabled = row?.Enabled == true;
        var effective = Resolve(defaults.Value, enabled, fields);
        return new()
        {
            OverrideEnabled = enabled,
            AdminSettingsStored = row is not null,
            EncryptionAvailable = encryption.IsConfigured,
            IsConfigured = effective.IsConfigured,
            ClientId = Field("clientId", GoogleHealthPlatformOptions.ClientIdKey, effective.ClientId),
            ClientSecret = Field("clientSecret", GoogleHealthPlatformOptions.ClientSecretKey, effective.ClientSecret, secret: true),
            RedirectUri = Field("redirectUri", GoogleHealthPlatformOptions.RedirectUriKey, effective.RedirectUri),
        };

        GoogleHealthAdminField Field(string name, string key, string value, bool secret = false)
        {
            var deployment = configuration[key]?.Trim() ?? "";
            var admin = fields.GetValueOrDefault(name) ?? "";
            var adminSet = !string.IsNullOrWhiteSpace(admin);
            var deploymentSet = !string.IsNullOrWhiteSpace(deployment);
            return new()
            {
                EnvironmentConfigured = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)),
                DeploymentConfigured = deploymentSet,
                AdminConfigured = adminSet,
                ValuesDiffer = adminSet && deploymentSet && admin != deployment,
                Source = enabled && adminSet ? "admin" : deploymentSet ? "deployment" :
                    !string.IsNullOrWhiteSpace(value) ? "base-domain" : "missing",
                DeploymentValue = secret ? null : deployment,
                AdminValue = secret ? null : admin,
                EffectiveValue = secret ? null : value,
            };
        }
    }

    public async Task<GoogleHealthAdminSaveResult> SaveAsync(SaveGoogleHealthAdminRequest request, CancellationToken ct)
    {
        var errors = new Dictionary<string, string>();
        if (!encryption.IsConfigured)
            return new() { Errors = new() { ["_"] = "encryption_unavailable" } };
        var (row, fields) = await ReadAsync(ct);
        if (request.UseDeploymentFields is null || request.UseDeploymentFields.Except(Names).Any())
            return new() { Errors = new() { ["_"] = "invalid_fields" } };
        foreach (var name in request.UseDeploymentFields) fields.Remove(name);
        Merge("clientId", request.ClientId);
        Merge("clientSecret", request.ClientSecret);
        Merge("redirectUri", request.RedirectUri);
        if (fields.TryGetValue("clientId", out var id) && !GoogleHealthPlatformOptions.IsValidClientId(id))
            errors["clientId"] = "invalid_client_id";
        if (fields.TryGetValue("redirectUri", out var uri) && !GoogleHealthPlatformOptions.IsValidRedirectUri(uri))
            errors["redirectUri"] = "invalid_redirect_uri";
        var effective = Resolve(defaults.Value, request.OverrideEnabled, fields);
        if (request.OverrideEnabled)
        {
            if (!GoogleHealthPlatformOptions.IsValidClientId(effective.ClientId)) errors.TryAdd("clientId", "required");
            if (string.IsNullOrWhiteSpace(effective.ClientSecret)) errors.TryAdd("clientSecret", "required");
            if (!GoogleHealthPlatformOptions.IsValidRedirectUri(effective.RedirectUri)) errors.TryAdd("redirectUri", "required");
            if (fields.ContainsKey("clientId") && effective.ClientId != defaults.Value.ClientId &&
                !fields.ContainsKey("clientSecret") && !errors.ContainsKey("clientId")) errors["clientSecret"] = "matching_secret_required";
        }
        if (errors.Count > 0) return new() { Errors = errors };
        await using var db = await contexts.CreatePlatformAsync(ct);
        var entity = await db.PlatformSettings.SingleOrDefaultAsync(x => x.Category == Category, ct);
        if (entity is null) { entity = new() { Category = Category }; db.PlatformSettings.Add(entity); }
        entity.Enabled = request.OverrideEnabled;
        entity.EncryptedJson = JsonSerializer.Serialize(encryption.EncryptSecrets(fields), Json);
        entity.ConfiguredFields = fields.Keys.ToList();
        await db.SaveChangesAsync(ct);
        return new() { Settings = Status(entity, fields) };

        void Merge(string name, string? value)
        {
            if (!string.IsNullOrWhiteSpace(value)) fields[name] = value.Trim();
        }
    }

    public async Task RemoveAsync(CancellationToken ct)
    {
        await using var db = await contexts.CreatePlatformAsync(ct);
        var row = await db.PlatformSettings.SingleOrDefaultAsync(x => x.Category == Category, ct);
        if (row is null) return;
        db.PlatformSettings.Remove(row);
        await db.SaveChangesAsync(ct);
    }
}
