using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Nocturne.Core.Models.Personal;
using Nocturne.Core.Contracts.Health;
using Nocturne.Infrastructure.Data;
using Nocturne.Infrastructure.Data.Entities;

namespace Nocturne.API.Services.Personal;

public sealed class GoogleHealthCoordinator
{
    internal sealed record Flow(string State, string Verifier, Guid SubjectId, string Settings, DateTimeOffset Expires);
    internal ConcurrentDictionary<Guid, Flow> Flows { get; } = new();
    internal ConcurrentDictionary<Guid, SemaphoreSlim> Locks { get; } = new();
    public SemaphoreSlim Gate(Guid tenant) => Locks.GetOrAdd(tenant, _ => new SemaphoreSlim(1));
}

public sealed class GoogleHealthService(NocturneDbContext db, IDataProtectionProvider protection,
    GoogleHealthCoordinator coordinator, GoogleHealthClient google) : IPersonalGoogleHealthService
{
    private sealed record Token(string RefreshToken, string[] Scopes);
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private IDataProtector Protector => protection.CreateProtector("Nocturne.Personal.GoogleHealth.v1", db.TenantId.ToString());
    private string Protect<T>(T value) => Protector.Protect(JsonSerializer.Serialize(value, Json));
    private T Unprotect<T>(string value) => JsonSerializer.Deserialize<T>(Protector.Unprotect(value), Json) ?? throw new JsonException();
    private Task<PersonalGoogleConnectionEntity?> Connection(CancellationToken ct) => db.PersonalGoogleConnections.SingleOrDefaultAsync(ct);

    public async Task<GoogleHealthStatus> StatusAsync(CancellationToken ct)
    {
        var row = await Connection(ct);
        if (row is null) return new() { Capabilities = GoogleHealthClient.Capabilities };
        GoogleHealthOptions settings;
        try
        {
            settings = Unprotect<GoogleHealthOptions>(row.ProtectedSettings);
            if (settings.DataTypes is null) throw new JsonException();
        }
        catch (Exception ex) when (ex is CryptographicException or JsonException or FormatException)
        {
            return new()
            {
                Capabilities = GoogleHealthClient.Capabilities, Connected = row.ProtectedToken is not null,
                LastSync = row.LastSync, ErrorCode = "stored_google_configuration_unreadable"
            };
        }
        var selectedTypes = settings.DataTypes
            .Where(type => GoogleHealthClient.SupportedTypes.Contains(type, StringComparer.Ordinal))
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        var selectionIsValid = selectedTypes.Length == settings.DataTypes.Length;
        Token? token;
        try
        {
            token = row.ProtectedToken is null ? null : Unprotect<Token>(row.ProtectedToken);
            if (token is not null && (string.IsNullOrWhiteSpace(token.RefreshToken) || token.Scopes is null)) throw new JsonException();
        }
        catch (Exception ex) when (ex is CryptographicException or JsonException or FormatException)
        {
            return new()
            {
                Capabilities = GoogleHealthClient.Capabilities, Configured = true, Connected = true,
                ClientId = settings.ClientId, CallbackUrl = settings.CallbackUrl, HistoryDays = settings.HistoryDays,
                SelectedTypes = selectedTypes, LastSync = row.LastSync,
                ErrorCode = "stored_google_configuration_unreadable"
            };
        }
        return new()
        {
            Capabilities = GoogleHealthClient.Capabilities, Configured = true, Connected = token is not null, ClientId = settings.ClientId,
            CallbackUrl = settings.CallbackUrl, HistoryDays = settings.HistoryDays,
            SelectedTypes = selectedTypes, GrantedTypes = selectedTypes.Where(t => token?.Scopes.Contains(GoogleHealthClient.ScopeFor(t)) == true).ToArray(),
            LastSync = row.LastSync, ErrorCode = selectionIsValid ? row.ErrorCode : "unsupported_type"
        };
    }

    public static void ValidateOptions(GoogleHealthOptions options)
    {
        if (options.DataTypes is null || options.DataTypes.Length == 0 || options.DataTypes.Length > 32 || options.DataTypes.Distinct().Count() != options.DataTypes.Length || options.DataTypes.Except(GoogleHealthClient.SupportedTypes).Any())
            throw new GoogleHealthException("unsupported_type");
        if (!options.ClientId.EndsWith(".apps.googleusercontent.com", StringComparison.Ordinal) || options.HistoryDays is < 1 or > 90)
            throw new GoogleHealthException("invalid_configuration");
        if (!Uri.TryCreate(options.CallbackUrl, UriKind.Absolute, out var callback) || callback.Scheme != "https" || callback.HostNameType != UriHostNameType.Dns || callback.UserInfo != "" || callback.Query != "" || callback.Fragment != "" || callback.AbsolutePath != "/personal/google/callback")
            throw new GoogleHealthException("invalid_callback");
    }

    public async Task SaveAsync(GoogleHealthOptions options, Guid subject, CancellationToken ct)
    {
        ValidateOptions(options);
        var gate = coordinator.Gate(db.TenantId); await gate.WaitAsync(ct);
        try
        {
            var row = await Connection(ct);
            if (row is null) { row = new() { Id = Guid.CreateVersion7(), SubjectId = subject }; db.PersonalGoogleConnections.Add(row); }
            else
            {
                if (row.SubjectId != subject) throw new GoogleHealthException("connection_owner_required");
                if (row.ProtectedToken is not null) throw new GoogleHealthException("disconnect_first");
                if (string.IsNullOrWhiteSpace(options.ClientSecret))
                {
                    var prior = Unprotect<GoogleHealthOptions>(row.ProtectedSettings);
                    if (options.ClientId == prior.ClientId) options.ClientSecret = prior.ClientSecret;
                }
            }
            if (string.IsNullOrWhiteSpace(options.ClientSecret)) throw new GoogleHealthException("client_secret_required");
            row.ProtectedSettings = Protect(options); row.ErrorCode = null; row.NextAttempt = null;
            coordinator.Flows.TryRemove(db.TenantId, out _);
            await db.SaveChangesAsync(ct);
        }
        finally { gate.Release(); }
    }

    public async Task<GoogleHealthAuthorize> StartAsync(Guid subject, CancellationToken ct)
    {
        var gate = coordinator.Gate(db.TenantId); await gate.WaitAsync(ct);
        try
        {
            var row = await Connection(ct) ?? throw new GoogleHealthException("configure_first");
            if (row.SubjectId != subject) throw new GoogleHealthException("connection_owner_required");
            if (row.ProtectedToken is not null) throw new GoogleHealthException("disconnect_first");
            var settings = Unprotect<GoogleHealthOptions>(row.ProtectedSettings);
            var verifier = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(48));
            var state = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
            coordinator.Flows[db.TenantId] = new(state, verifier, subject, row.ProtectedSettings, DateTimeOffset.UtcNow.AddMinutes(10));
            var parameters = new Dictionary<string, string?>
            {
                ["client_id"] = settings.ClientId, ["redirect_uri"] = settings.CallbackUrl,
                ["response_type"] = "code", ["access_type"] = "offline", ["prompt"] = "consent select_account",
                ["scope"] = "openid " + string.Join(' ', settings.DataTypes.Select(GoogleHealthClient.ScopeFor).Distinct()),
                ["state"] = state, ["code_challenge_method"] = "S256",
                ["code_challenge"] = WebEncoders.Base64UrlEncode(SHA256.HashData(Encoding.ASCII.GetBytes(verifier)))
            };
            return new() { Url = QueryHelpers.AddQueryString("https://accounts.google.com/o/oauth2/v2/auth", parameters) };
        }
        finally { gate.Release(); }
    }

    public async Task CompleteAsync(GoogleHealthCallback callback, Guid subject, CancellationToken ct)
    {
        var gate = coordinator.Gate(db.TenantId); await gate.WaitAsync(ct);
        try
        {
            if (!coordinator.Flows.TryGetValue(db.TenantId, out var flow) || flow.Expires <= DateTimeOffset.UtcNow || flow.SubjectId != subject || !CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(flow.State), Encoding.UTF8.GetBytes(callback.State)))
                throw new GoogleHealthException("expired_signin");
            coordinator.Flows.TryRemove(db.TenantId, out _);
            var row = await Connection(ct) ?? throw new GoogleHealthException("configure_first");
            if (row.SubjectId != subject || row.ProtectedSettings != flow.Settings) throw new GoogleHealthException("expired_signin");
            var settings = Unprotect<GoogleHealthOptions>(row.ProtectedSettings);
            var response = await google.ExchangeAsync(new()
            {
                ["grant_type"] = "authorization_code", ["code"] = callback.Code,
                ["code_verifier"] = flow.Verifier, ["client_id"] = settings.ClientId,
                ["client_secret"] = settings.ClientSecret!, ["redirect_uri"] = settings.CallbackUrl
            }, ct);
            var access = response.GetProperty("access_token").GetString()!;
            var scopes = response.TryGetProperty("scope", out var scope) ? (scope.GetString() ?? "").Split(' ') : [];
            if (!response.TryGetProperty("refresh_token", out var refresh) || string.IsNullOrEmpty(refresh.GetString())) throw new GoogleHealthException("offline_access_required");
            var account = await google.AccountKeyAsync(access, ct);
            if (row.AccountKey is not null && row.AccountKey != account)
            {
                await google.RevokeAsync(refresh.GetString()!, ct);
                throw new GoogleHealthException("account_mismatch");
            }
            row.AccountKey = account;
            row.ProtectedToken = Protect(new Token(refresh.GetString()!, scopes));
            row.NextAttempt = null; row.LastAttempt = null;
            row.ErrorCode = settings.DataTypes.All(t => scopes.Contains(GoogleHealthClient.ScopeFor(t))) ? null : "partial_consent";
            await db.SaveChangesAsync(ct);
        }
        finally { gate.Release(); }
    }

    public async Task DisconnectAsync(Guid subject, CancellationToken ct)
    {
        var gate = coordinator.Gate(db.TenantId); await gate.WaitAsync(ct);
        try
        {
            var row = await Connection(ct);
            if (row is null) return;
            if (row.SubjectId != subject) throw new GoogleHealthException("connection_owner_required");
            Token? token = null;
            var revokeFailed = false;
            if (row.ProtectedToken is not null)
                try { token = Unprotect<Token>(row.ProtectedToken); }
                catch (Exception ex) when (ex is CryptographicException or JsonException or FormatException) { revokeFailed = true; }
            row.ProtectedToken = null; row.ErrorCode = revokeFailed ? "revoke_in_google" : null; row.NextAttempt = null;
            coordinator.Flows.TryRemove(db.TenantId, out _);
            await db.SaveChangesAsync(ct);
            if (token is not null)
            {
                try { if (!await google.RevokeAsync(token.RefreshToken, ct)) row.ErrorCode = "revoke_in_google"; }
                catch (HttpRequestException) { row.ErrorCode = "revoke_in_google"; }
                catch (TaskCanceledException) { row.ErrorCode = "revoke_in_google"; }
                await db.SaveChangesAsync(CancellationToken.None);
            }
        }
        finally { gate.Release(); }
    }

    public async Task PurgeAsync(Guid subject, CancellationToken ct)
    {
        var gate = coordinator.Gate(db.TenantId); await gate.WaitAsync(ct);
        try
        {
            var row = await Connection(ct);
            if (row is null) return;
            if (row.SubjectId != subject) throw new GoogleHealthException("connection_owner_required");
            if (row.ProtectedToken is not null) throw new GoogleHealthException("disconnect_first");
            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            await db.PersonalHealthReadings.ExecuteDeleteAsync(ct);
            row.AccountKey = null; row.LastSync = null;
            await db.SaveChangesAsync(ct); await transaction.CommitAsync(ct);
        }
        finally { gate.Release(); }
    }

    public async Task SyncAsync(bool force, CancellationToken ct)
    {
        var gate = coordinator.Gate(db.TenantId);
        if (!await gate.WaitAsync(0, ct)) return;
        try
        {
            var row = await Connection(ct);
            if (row?.ProtectedToken is null || row.NextAttempt > DateTimeOffset.UtcNow || (!force && row.LastAttempt > DateTimeOffset.UtcNow.AddMinutes(-15))) return;
            row.LastAttempt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
            try
            {
                var settings = Unprotect<GoogleHealthOptions>(row.ProtectedSettings);
                var token = Unprotect<Token>(row.ProtectedToken);
                var response = await google.ExchangeAsync(new()
                {
                    ["grant_type"] = "refresh_token", ["refresh_token"] = token.RefreshToken,
                    ["client_id"] = settings.ClientId, ["client_secret"] = settings.ClientSecret!
                }, ct);
                if (response.TryGetProperty("scope", out var granted)) token = token with { Scopes = (granted.GetString() ?? "").Split(' ') };
                if (response.TryGetProperty("refresh_token", out var replacement)) token = token with { RefreshToken = replacement.GetString()! };
                row.ProtectedToken = Protect(token);
                await db.SaveChangesAsync(ct);
                var active = settings.DataTypes.Where(t => token.Scopes.Contains(GoogleHealthClient.ScopeFor(t))).ToArray();
                if (active.Length == 0) throw new GoogleHealthException("permission_denied");
                var to = DateTimeOffset.UtcNow; var from = to.AddDays(-settings.HistoryDays);
                var readings = new List<PersonalHealthReading>();
                foreach (var type in active) readings.AddRange(await google.ReadAsync(response.GetProperty("access_token").GetString()!, type, from, to, ct));
                if (readings.Select(GoogleHealthClient.Key).Distinct().Count() != readings.Count) throw new GoogleHealthException("duplicate_google_data");
                // Replace only the completely fetched window, so retries, edits and source deletions cannot double-count steps.
                await using var transaction = await db.Database.BeginTransactionAsync(ct);
                var first = from.ToUnixTimeMilliseconds(); var last = to.ToUnixTimeMilliseconds();
                await db.PersonalHealthReadings.Where(x => active.Contains(x.DataType) && x.Mills >= first && x.Mills < last).ExecuteDeleteAsync(ct);
                db.PersonalHealthReadings.AddRange(readings.Select(r => new PersonalHealthReadingEntity
                {
                    Id = Guid.CreateVersion7(), DataType = r.DataType, SourceKey = GoogleHealthClient.Key(r), Mills = r.Mills,
                    EndMills = r.EndMills, UtcOffsetMinutes = r.UtcOffsetMinutes, Value = r.Value, Unit = r.Unit
                }));
                row.LastSync = to; row.NextAttempt = null; row.ErrorCode = active.Length == settings.DataTypes.Length ? null : "partial_consent";
                await db.SaveChangesAsync(ct); await transaction.CommitAsync(ct);
            }
            catch (Exception ex) when (ex is GoogleHealthException or HttpRequestException or JsonException or TaskCanceledException)
            {
                if (ct.IsCancellationRequested) throw;
                db.ChangeTracker.Clear();
                row = await Connection(ct);
                if (row is not null)
                {
                    row.ErrorCode = ex is GoogleHealthException error ? error.Message : "google_unavailable";
                    if (ex is GoogleHealthException { RetryAfter: { } delay } && delay > TimeSpan.Zero)
                        row.NextAttempt = DateTimeOffset.UtcNow.Add(delay > TimeSpan.FromDays(7) ? TimeSpan.FromDays(7) : delay);
                    if (row.ErrorCode == "reconnect_required") row.ProtectedToken = null;
                    await db.SaveChangesAsync(ct);
                }
            }
        }
        finally { gate.Release(); }
    }
}
