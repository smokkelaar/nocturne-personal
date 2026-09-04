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
    GoogleHealthCoordinator coordinator, GoogleHealthClient google,
    ILogger<GoogleHealthService>? logger = null) : IPersonalGoogleHealthService
{
    private sealed record Token(
        string RefreshToken,
        string[] Scopes,
        string? AccessToken = null,
        DateTimeOffset? AccessTokenExpiresAt = null);
    private static readonly TimeSpan AccessTokenSafety = TimeSpan.FromMinutes(1);
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private IDataProtector Protector => protection.CreateProtector("Nocturne.Personal.GoogleHealth.v1", db.TenantId.ToString());
    private string Protect<T>(T value) => Protector.Protect(JsonSerializer.Serialize(value, Json));
    private T Unprotect<T>(string value) => JsonSerializer.Deserialize<T>(Protector.Unprotect(value), Json) ?? throw new JsonException();
    private Task<PersonalGoogleConnectionEntity?> Connection(CancellationToken ct) => db.PersonalGoogleConnections.SingleOrDefaultAsync(ct);

    private static string RequiredString(JsonElement response, string name, string stage)
    {
        if (!response.TryGetProperty(name, out var value) || value.ValueKind != JsonValueKind.String ||
            string.IsNullOrWhiteSpace(value.GetString()))
            throw new GoogleHealthException("invalid_token_response", stage: stage);
        return value.GetString()!;
    }

    private static int RequiredExpiresIn(JsonElement response, string stage)
    {
        if (!response.TryGetProperty("expires_in", out var value) || !value.TryGetInt32(out var seconds) || seconds <= 0)
            throw new GoogleHealthException("invalid_token_response", stage: stage);
        return seconds;
    }

    private static void ValidateTokenType(JsonElement response, string stage)
    {
        if (response.TryGetProperty("token_type", out var value) &&
            (value.ValueKind != JsonValueKind.String ||
             !string.Equals(value.GetString(), "Bearer", StringComparison.OrdinalIgnoreCase)))
            throw new GoogleHealthException("invalid_token_response", stage: stage);
    }

    private static string[] ResponseScopes(JsonElement response, string[] fallback)
    {
        if (!response.TryGetProperty("scope", out var value) || value.ValueKind != JsonValueKind.String)
            return fallback;
        return (value.GetString() ?? "").Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.Ordinal).ToArray();
    }

    private static string EncodeError(string code, IEnumerable<string>? dataTypes = null)
    {
        var types = dataTypes?.Where(type => GoogleHealthClient.SupportedTypes.Contains(type, StringComparer.Ordinal))
            .Distinct(StringComparer.Ordinal).ToArray() ?? [];
        return types.Length == 0 ? code : $"{code}:{string.Join(',', types)}";
    }

    private static (string? Code, string[] DataTypes) DecodeError(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return (null, []);
        var separator = value.IndexOf(':');
        if (separator < 0) return (value, []);
        return (value[..separator], value[(separator + 1)..].Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(type => GoogleHealthClient.SupportedTypes.Contains(type, StringComparer.Ordinal))
            .Distinct(StringComparer.Ordinal).ToArray());
    }

    private void LogFailure(GoogleHealthException error) => logger?.LogWarning(
        "Google Health import failed for tenant {TenantId} with code {Code} at stage {Stage} for data type {DataType}; provider status {ProviderStatus}, provider reason {ProviderReason}",
        db.TenantId, error.Message, error.Stage, error.DataType, error.ProviderStatus, error.ProviderReason);

    private async Task<Token> RefreshSessionAsync(GoogleHealthOptions settings, Token token, CancellationToken ct)
    {
        var response = await google.RefreshAccessTokenAsync(new()
        {
            ["grant_type"] = "refresh_token", ["refresh_token"] = token.RefreshToken,
            ["client_id"] = settings.ClientId, ["client_secret"] = settings.ClientSecret!
        }, ct);
        ValidateTokenType(response, "token_refresh");
        var access = RequiredString(response, "access_token", "token_refresh");
        var expiresIn = RequiredExpiresIn(response, "token_refresh");
        var scopes = ResponseScopes(response, token.Scopes);
        var refresh = token.RefreshToken;
        if (response.TryGetProperty("refresh_token", out var replacement))
        {
            if (replacement.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(replacement.GetString()))
                throw new GoogleHealthException("invalid_token_response", stage: "token_refresh");
            refresh = replacement.GetString()!;
        }
        return new Token(refresh, scopes, access, DateTimeOffset.UtcNow.AddSeconds(expiresIn));
    }

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
                LastAttempt = row.LastAttempt, LastSync = row.LastSync, NextAttempt = row.NextAttempt,
                ErrorCode = "stored_google_configuration_unreadable"
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
                SelectedTypes = selectedTypes, LastAttempt = row.LastAttempt, LastSync = row.LastSync,
                NextAttempt = row.NextAttempt,
                ErrorCode = "stored_google_configuration_unreadable"
            };
        }
        var storedError = DecodeError(row.ErrorCode);
        return new()
        {
            Capabilities = GoogleHealthClient.Capabilities, Configured = true, Connected = token is not null, ClientId = settings.ClientId,
            CallbackUrl = settings.CallbackUrl, HistoryDays = settings.HistoryDays,
            SelectedTypes = selectedTypes, GrantedTypes = selectedTypes.Where(t => token?.Scopes.Contains(GoogleHealthClient.ScopeFor(t)) == true).ToArray(),
            AccessTokenExpiresAt = token?.AccessTokenExpiresAt, LastAttempt = row.LastAttempt, LastSync = row.LastSync,
            NextAttempt = row.NextAttempt, ErrorCode = selectionIsValid ? storedError.Code : "unsupported_type",
            ErrorDataTypes = selectionIsValid ? storedError.DataTypes : []
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
            var response = await google.ExchangeAuthorizationCodeAsync(new()
            {
                ["grant_type"] = "authorization_code", ["code"] = callback.Code,
                ["code_verifier"] = flow.Verifier, ["client_id"] = settings.ClientId,
                ["client_secret"] = settings.ClientSecret!, ["redirect_uri"] = settings.CallbackUrl
            }, ct);
            ValidateTokenType(response, "authorization_code");
            var access = RequiredString(response, "access_token", "authorization_code");
            var expiresIn = RequiredExpiresIn(response, "authorization_code");
            var requestedScopes = settings.DataTypes.Select(GoogleHealthClient.ScopeFor).Append("openid")
                .Distinct(StringComparer.Ordinal).ToArray();
            var scopes = ResponseScopes(response, requestedScopes);
            if (!response.TryGetProperty("refresh_token", out var refreshValue) ||
                refreshValue.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(refreshValue.GetString()))
                throw new GoogleHealthException("offline_access_required", stage: "authorization_code");
            var refresh = refreshValue.GetString()!;
            var account = await google.AccountKeyAsync(access, ct);
            if (row.AccountKey is not null && row.AccountKey != account)
            {
                await google.RevokeAsync(refresh, ct);
                throw new GoogleHealthException("account_mismatch");
            }
            var now = DateTimeOffset.UtcNow;
            var missingScopes = settings.DataTypes
                .Where(type => !scopes.Contains(GoogleHealthClient.ScopeFor(type), StringComparer.Ordinal)).ToArray();
            row.AccountKey = account;
            row.ProtectedToken = Protect(new Token(refresh, scopes, access, now.AddSeconds(expiresIn)));
            row.NextAttempt = null; row.LastAttempt = null;
            row.ErrorCode = missingScopes.Length == 0 ? null : EncodeError("partial_consent", missingScopes);
            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex) when (ex is GoogleHealthException or HttpRequestException or JsonException or TaskCanceledException)
        {
            if (ct.IsCancellationRequested) throw;
            var error = ex as GoogleHealthException ?? new GoogleHealthException(
                ex is JsonException ? "invalid_google_response" : "google_unavailable",
                stage: ex is JsonException ? "token_response" : "network");
            LogFailure(error);
            db.ChangeTracker.Clear();
            var row = await Connection(CancellationToken.None);
            if (row is not null && row.ProtectedToken is null)
            {
                row.LastAttempt = DateTimeOffset.UtcNow;
                row.NextAttempt = null;
                row.ErrorCode = EncodeError(error.Message, error.DataType is null ? null : [error.DataType]);
                await db.SaveChangesAsync(CancellationToken.None);
            }
            throw error;
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
                if (string.IsNullOrWhiteSpace(token.RefreshToken) || token.Scopes is null) throw new JsonException();
                var now = DateTimeOffset.UtcNow;
                var access = token.AccessToken ?? "";
                if (string.IsNullOrWhiteSpace(access) || token.AccessTokenExpiresAt is null ||
                    token.AccessTokenExpiresAt <= now.Add(AccessTokenSafety))
                {
                    token = await RefreshSessionAsync(settings, token, ct);
                    access = token.AccessToken!;
                    row.ProtectedToken = Protect(token);
                    await db.SaveChangesAsync(ct);
                }
                var active = settings.DataTypes.Where(t => token.Scopes.Contains(GoogleHealthClient.ScopeFor(t))).ToArray();
                if (active.Length == 0) throw new GoogleHealthException("permission_denied", stage: "scope_validation");
                var to = DateTimeOffset.UtcNow; var from = to.AddDays(-settings.HistoryDays);
                async Task<List<PersonalHealthReading>> ReadAllAsync()
                {
                    var result = new List<PersonalHealthReading>();
                    foreach (var type in active) result.AddRange(await google.ReadAsync(access, type, from, to, ct));
                    return result;
                }
                List<PersonalHealthReading> readings;
                try
                {
                    readings = await ReadAllAsync();
                }
                catch (GoogleHealthException first) when (first.Message == "access_token_rejected")
                {
                    logger?.LogInformation(
                        "Google Health access token was rejected early for tenant {TenantId}, data type {DataType}; refreshing the session once",
                        db.TenantId, first.DataType);
                    token = await RefreshSessionAsync(settings, token, ct);
                    access = token.AccessToken!;
                    row.ProtectedToken = Protect(token);
                    await db.SaveChangesAsync(ct);
                    try
                    {
                        readings = await ReadAllAsync();
                    }
                    catch (GoogleHealthException second) when (second.Message == "access_token_rejected")
                    {
                        throw new GoogleHealthException("reconnect_required", stage: second.Stage,
                            dataType: second.DataType, providerReason: second.ProviderReason,
                            providerStatus: second.ProviderStatus);
                    }
                }
                if (readings.Select(GoogleHealthClient.Key).Distinct().Count() != readings.Count)
                    throw new GoogleHealthException("duplicate_google_data", stage: "data_validation");
                // Replace only the completely fetched window, so retries, edits and source deletions cannot double-count steps.
                await using var transaction = await db.Database.BeginTransactionAsync(ct);
                var firstMills = from.ToUnixTimeMilliseconds(); var lastMills = to.ToUnixTimeMilliseconds();
                await db.PersonalHealthReadings.Where(x => active.Contains(x.DataType) && x.Mills >= firstMills && x.Mills < lastMills).ExecuteDeleteAsync(ct);
                db.PersonalHealthReadings.AddRange(readings.Select(r => new PersonalHealthReadingEntity
                {
                    Id = Guid.CreateVersion7(), DataType = r.DataType, SourceKey = GoogleHealthClient.Key(r), Mills = r.Mills,
                    EndMills = r.EndMills, UtcOffsetMinutes = r.UtcOffsetMinutes, Value = r.Value, Unit = r.Unit
                }));
                var missingConsent = settings.DataTypes.Except(active, StringComparer.Ordinal).ToArray();
                var emptyTypes = active.Where(type => readings.All(reading => reading.DataType != type)).ToArray();
                row.LastSync = to; row.NextAttempt = null;
                row.ErrorCode = missingConsent.Length > 0
                    ? EncodeError("partial_consent", missingConsent)
                    : emptyTypes.Length > 0 ? EncodeError("no_google_data", emptyTypes) : null;
                await db.SaveChangesAsync(ct); await transaction.CommitAsync(ct);
            }
            catch (Exception ex) when (ex is GoogleHealthException or HttpRequestException or JsonException or TaskCanceledException)
            {
                if (ct.IsCancellationRequested) throw;
                var error = ex as GoogleHealthException ?? new GoogleHealthException(
                    ex is JsonException ? "invalid_google_response" : "google_unavailable",
                    stage: ex is JsonException ? "response_parse" : "network");
                LogFailure(error);
                db.ChangeTracker.Clear();
                row = await Connection(ct);
                if (row is not null)
                {
                    row.ErrorCode = EncodeError(error.Message, error.DataType is null ? null : [error.DataType]);
                    row.NextAttempt = null;
                    if (error.RetryAfter is { } delay && delay > TimeSpan.Zero)
                        row.NextAttempt = DateTimeOffset.UtcNow.Add(delay > TimeSpan.FromDays(7) ? TimeSpan.FromDays(7) : delay);
                    if (error.Message == "reconnect_required") row.ProtectedToken = null;
                    await db.SaveChangesAsync(ct);
                }
            }
        }
        finally { gate.Release(); }
    }
}
