using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Nocturne.Connectors.Core.Interfaces;
using Nocturne.Connectors.Core.Models;
using Nocturne.Connectors.Core.Services;
using Nocturne.Connectors.GoogleHealth.Configurations;
using Nocturne.Connectors.GoogleHealth.Models;
using Nocturne.Core.Constants;
using Nocturne.Core.Contracts.Connectors;
using Nocturne.Core.Contracts.Health;
using Nocturne.Core.Contracts.Multitenancy;
using Nocturne.Core.Models.Health;

namespace Nocturne.Connectors.GoogleHealth.Services;

public sealed class GoogleHealthConnectorService(
    HttpClient httpClient,
    IConnectorServerResolver<GoogleHealthConnectorConfiguration> serverResolver,
    GoogleHealthClient google,
    GoogleHealthAuthTokenProvider oauth,
    IGoogleHealthReadingWriter writer,
    IGoogleHealthSyncCoordinator coordinator,
    IConnectorConfigurationService connectorConfigurations,
    ITenantAccessor tenantAccessor,
    IConnectorConfigurationLoader<GoogleHealthConnectorConfiguration> configurationLoader,
    ILogger<GoogleHealthConnectorService> logger,
    IConnectorPublisher? publisher = null)
    : BaseConnectorService<GoogleHealthConnectorConfiguration>(httpClient, serverResolver, logger, publisher)
{
    private const string ConnectorName = "GoogleHealth";

    protected override string ConnectorSource => DataSources.GoogleHealthConnector;
    public override string ServiceName => ServiceNames.GoogleHealthConnector;
    protected override DateTime? InitialSyncFloor => null;

    // The base watermark (CalculateSinceTimestampAsync) only tracks the glucose/treatment
    // families via IConnectorPublisher, which Google Health never publishes through — so its
    // own resume point is persisted here instead of relying on (and bypassing) the base one.
    private const string LastSyncedToKey = "lastSyncedTo";

    public override Task<SyncResult> SyncDataAsync(
        GoogleHealthConnectorConfiguration config,
        CancellationToken cancellationToken = default,
        DateTime? since = null,
        ISyncProgressReporter? progressReporter = null) =>
        // The managed backfill/live window resolved inside PerformSyncInternalAsync now owns
        // Google Health's resume point entirely; the value passed through here is never read, it
        // only needs to be non-null so the base class skips its own (glucose/treatment-only) watermark.
        base.SyncDataAsync(config, cancellationToken, since ?? DateTime.UtcNow, progressReporter);

    // How many single-day backfill steps run before a periodic tick is spent re-syncing "today"
    // instead, so a multi-year backfill still keeps recent data close to live the whole time.
    private const int BackfillRefreshEveryDays = 10;

    // Matches GoogleHealthConnectorConfiguration's own validation floor for an explicit ImportFrom.
    private static readonly DateTimeOffset EarliestSupportedDate = new(2000, 1, 1, 0, 0, 0, TimeSpan.Zero);

    private const string BackfillCursorKey = "backfillCursorDate";
    private const string BackfillFloorKey = "backfillFloorDate";
    private const string BackfillDaysSinceRefreshKey = "backfillDaysSinceRefresh";
    private const string BackfillCompleteKey = "backfillComplete";

    /// <summary>
    ///     Persisted backfill progress: <see cref="CursorDate"/> is the oldest UTC day already
    ///     imported (null before the very first sync), <see cref="FloorDate"/> is the oldest day the
    ///     backfill is aiming for, and <see cref="DaysSinceRefresh"/> counts consecutive backfill days
    ///     since "today" was last re-synced for freshness.
    /// </summary>
    private readonly record struct BackfillState(
        DateTimeOffset? CursorDate, DateTimeOffset FloorDate, int DaysSinceRefresh, bool Complete);

    private readonly record struct GoogleHealthSyncWindow(DateTimeOffset From, DateTimeOffset To, bool IsBackfillDay, bool IsManaged);

    /// <summary>
    ///     Resolves exactly one small window to import this run: either "today" (kept live on every
    ///     first sync, every tenth backfill step, and once backfill is complete) or the single next
    ///     older calendar day of an in-progress backfill. A multi-year history is therefore never
    ///     attempted in one call — each run fits comfortably inside the per-tenant sync timeout, at
    ///     the cost of the whole backfill taking many runs to finish. A caller-supplied window is
    ///     honored exactly, without touching backfill state, when it is already bounded to at most one
    ///     day; a wider or open-ended one (an admin cursor reset re-pulling all history) instead
    ///     (re)starts the managed backfill from its lower bound, or from the earliest supported date
    ///     when none is given.
    /// </summary>
    private async Task<GoogleHealthSyncWindow> ResolveWindowAsync(
        SyncRequest request, GoogleHealthConnectorConfiguration config, DateTimeOffset now, CancellationToken ct)
    {
        var today = new DateTimeOffset(DateTime.SpecifyKind(now.UtcDateTime.Date, DateTimeKind.Utc));
        if (request.To is { } requestedTo)
        {
            var explicitTo = new DateTimeOffset(DateTime.SpecifyKind(requestedTo, DateTimeKind.Utc));
            var explicitFrom = request.From is { } requestedFrom
                ? new DateTimeOffset(DateTime.SpecifyKind(requestedFrom, DateTimeKind.Utc))
                : (DateTimeOffset?)null;
            if (explicitFrom is { } bounded && explicitTo - bounded <= TimeSpan.FromDays(1))
                return new GoogleHealthSyncWindow(bounded, explicitTo, IsBackfillDay: false, IsManaged: false);

            var floor = explicitFrom is { } floorFrom
                ? new DateTimeOffset(DateTime.SpecifyKind(floorFrom.Date, DateTimeKind.Utc))
                : EarliestSupportedDate;
            await SaveBackfillStateAsync(new BackfillState(today, floor, 0, floor >= today), ct);
            return new GoogleHealthSyncWindow(await LiveFromAsync(ct), now, IsBackfillDay: false, IsManaged: true);
        }

        var state = await LoadBackfillStateAsync(ct);
        if (state.CursorDate is null || state.Complete || state.DaysSinceRefresh >= BackfillRefreshEveryDays)
            return new GoogleHealthSyncWindow(await LiveFromAsync(ct), now, IsBackfillDay: false, IsManaged: true);

        var day = state.CursorDate.Value.AddDays(-1);
        if (day < state.FloorDate) day = state.FloorDate;
        return new GoogleHealthSyncWindow(day, day.AddDays(1), IsBackfillDay: true, IsManaged: true);
    }

    /// <summary>
    ///     Advances the persisted backfill state after a successful sync. Returns true only the run
    ///     that first reaches the floor, so the one-time explicit <see cref="GoogleHealthConnectorConfiguration.ImportFrom"/>
    ///     is consumed once the whole requested history has actually landed, not after a single call.
    /// </summary>
    private async Task<bool> AdvanceBackfillStateAsync(
        GoogleHealthSyncWindow window, GoogleHealthConnectorConfiguration config, CancellationToken ct)
    {
        var state = await LoadBackfillStateAsync(ct);
        if (state.CursorDate is null)
        {
            var today = new DateTimeOffset(DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc));
            var floor = ComputeBackfillFloor(config, today);
            var complete = floor >= today;
            await SaveBackfillStateAsync(new BackfillState(today, floor, 0, complete), ct);
            return complete;
        }
        if (window.IsBackfillDay)
        {
            var reachedFloor = window.From <= state.FloorDate;
            await SaveBackfillStateAsync(
                state with { CursorDate = window.From, DaysSinceRefresh = state.DaysSinceRefresh + 1, Complete = reachedFloor },
                ct);
            return reachedFloor && !state.Complete;
        }
        if (!state.Complete)
            await SaveBackfillStateAsync(state with { DaysSinceRefresh = 0 }, ct);
        return false;
    }

    private async Task<DateTimeOffset> LiveFromAsync(CancellationToken ct)
    {
        var watermark = await LoadWatermarkAsync(ct);
        return watermark is { } lastSyncedTo
            ? new DateTimeOffset(DateTime.SpecifyKind(lastSyncedTo, DateTimeKind.Utc)).AddMinutes(-5)
            : new DateTimeOffset(DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc));
    }

    private static DateTimeOffset ComputeBackfillFloor(GoogleHealthConnectorConfiguration config, DateTimeOffset today) =>
        string.IsNullOrWhiteSpace(config.ImportFrom)
            ? today.AddDays(-config.HistoryDays)
            : new DateTimeOffset(DateTime.SpecifyKind(
                DateTimeOffset.Parse(config.ImportFrom, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind).UtcDateTime.Date,
                DateTimeKind.Utc));

    private async Task<BackfillState> LoadBackfillStateAsync(CancellationToken ct)
    {
        var stored = await connectorConfigurations.GetConfigurationAsync(ConnectorName, ct);
        if (stored is null) return new BackfillState(null, EarliestSupportedDate, 0, false);
        var configuration = JsonDocument.Parse(stored.Configuration.RootElement.GetRawText())
            .RootElement.Deserialize<Dictionary<string, JsonElement>>() ?? [];
        return new BackfillState(
            ParseStoredDate(configuration, BackfillCursorKey),
            ParseStoredDate(configuration, BackfillFloorKey) ?? EarliestSupportedDate,
            configuration.TryGetValue(BackfillDaysSinceRefreshKey, out var days) && days.ValueKind == JsonValueKind.Number
                ? days.GetInt32()
                : 0,
            configuration.TryGetValue(BackfillCompleteKey, out var complete) && complete.ValueKind == JsonValueKind.True);
    }

    private static DateTimeOffset? ParseStoredDate(Dictionary<string, JsonElement> configuration, string key) =>
        configuration.TryGetValue(key, out var element) && element.ValueKind == JsonValueKind.String &&
        DateTime.TryParse(element.GetString(), CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var value)
            ? new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Utc))
            : null;

    private async Task SaveBackfillStateAsync(BackfillState state, CancellationToken ct)
    {
        var stored = await connectorConfigurations.GetConfigurationAsync(ConnectorName, ct);
        var configuration = stored is null
            ? []
            : JsonDocument.Parse(stored.Configuration.RootElement.GetRawText())
                .RootElement.Deserialize<Dictionary<string, JsonElement>>() ?? [];
        configuration[BackfillCursorKey] = state.CursorDate is { } cursor
            ? JsonSerializer.SerializeToElement(cursor.UtcDateTime.ToString("o"))
            : JsonSerializer.SerializeToElement<string?>(null);
        configuration[BackfillFloorKey] = JsonSerializer.SerializeToElement(state.FloorDate.UtcDateTime.ToString("o"));
        configuration[BackfillDaysSinceRefreshKey] = JsonSerializer.SerializeToElement(state.DaysSinceRefresh);
        configuration[BackfillCompleteKey] = JsonSerializer.SerializeToElement(state.Complete);
        using var updated = JsonSerializer.SerializeToDocument(configuration);
        await connectorConfigurations.SaveConfigurationAsync(ConnectorName, updated, ct: ct);
    }

    private async Task<DateTime?> LoadWatermarkAsync(CancellationToken ct)
    {
        var stored = await connectorConfigurations.GetConfigurationAsync(ConnectorName, ct);
        if (stored is null) return null;
        using var document = JsonDocument.Parse(stored.Configuration.RootElement.GetRawText());
        if (!document.RootElement.TryGetProperty(LastSyncedToKey, out var element) ||
            element.ValueKind != JsonValueKind.String)
            return null;
        return DateTime.TryParse(element.GetString(), CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var value)
            ? value
            : null;
    }

    private async Task PersistWatermarkAsync(DateTimeOffset to, CancellationToken ct)
    {
        var stored = await connectorConfigurations.GetConfigurationAsync(ConnectorName, ct);
        var configuration = stored is null
            ? []
            : JsonDocument.Parse(stored.Configuration.RootElement.GetRawText())
                .RootElement.Deserialize<Dictionary<string, JsonElement>>() ?? [];
        // Never move the resume point backwards: a manual/admin resync of an older window must
        // not widen every later periodic sync back into a re-crawl of everything since.
        if (configuration.TryGetValue(LastSyncedToKey, out var existing) &&
            existing.ValueKind == JsonValueKind.String &&
            DateTime.TryParse(existing.GetString(), CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var existingValue) &&
            existingValue >= to.UtcDateTime)
            return;
        configuration[LastSyncedToKey] = JsonSerializer.SerializeToElement(to.UtcDateTime.ToString("o"));
        using var updated = JsonSerializer.SerializeToDocument(configuration);
        await connectorConfigurations.SaveConfigurationAsync(ConnectorName, updated, ct: ct);
    }

    protected override async Task<SyncResult> PerformSyncInternalAsync(
        SyncRequest request,
        GoogleHealthConnectorConfiguration config,
        CancellationToken cancellationToken)
    {
        var result = new SyncResult { StartTime = DateTimeOffset.UtcNow };
        var tenantId = tenantAccessor.TenantId;
        var gate = coordinator.Gate(tenantId);
        await gate.WaitAsync(cancellationToken);
        try
        {
            config = await configurationLoader.LoadForTenantAsync(cancellationToken);
            if (!config.Enabled) return Complete(result);
            var selected = ResolveActiveTypes(request, config)
                .Select(type => GoogleHealthClient.TryGetDataType(type, out var dataType)
                    ? dataType
                    : throw new GoogleHealthException("unsupported_type"))
                .ToArray();
            if (config.PreviewOnly || selected.Length == 0)
            {
                return Complete(result);
            }

            coordinator.Report(tenantId, GoogleHealthSyncPhase.RefreshingSession);
            var session = await SessionAsync(config, cancellationToken);
            var active = selected
                .Where(type => session.Scopes.Contains(GoogleHealthClient.ScopeFor(type), StringComparer.Ordinal))
                .ToArray();
            if (active.Length == 0)
                throw new GoogleHealthException("permission_denied", stage: "scope_validation");
            var missingConsent = selected.Except(active, StringComparer.Ordinal).ToArray();

            var window = await ResolveWindowAsync(request, config, DateTimeOffset.UtcNow, cancellationToken);
            var from = window.From;
            var to = window.To;

            logger.LogInformation(
                "Starting Google Health connector sync for tenant {TenantId} from {From} to {To} ({WindowKind}). Active data types: {ActiveDataTypes}",
                tenantId, from, to, window.IsBackfillDay ? "backfill day" : "live", string.Join(',', active));

            coordinator.Report(tenantId, GoogleHealthSyncPhase.Reading, completedDataTypes: 0, totalDataTypes: active.Length);
            await ReadWithRefreshAsync(config, session.AccessToken!, active, from, to, tenantId, result, cancellationToken);
            if (missingConsent.Length == 0)
            {
                await PersistWatermarkAsync(to, cancellationToken);
                if (window.IsManaged)
                {
                    var justCompletedBackfill = await AdvanceBackfillStateAsync(window, config, cancellationToken);
                    if (justCompletedBackfill && !string.IsNullOrWhiteSpace(config.ImportFrom))
                        await ConsumeImportFromAsync(cancellationToken);
                }
            }
            return Complete(result, missingConsent.Length == 0
                ? string.Empty
                : GoogleHealthErrorCode.Encode("partial_consent", missingConsent));
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            logger.LogInformation("Google Health import was cancelled for tenant {TenantId}", tenantId);
            throw;
        }
        catch (Exception ex) when (ex is GoogleHealthException or HttpRequestException or JsonException or TaskCanceledException)
        {
            var error = ex as GoogleHealthException ?? new GoogleHealthException(
                ex is JsonException ? "invalid_google_response" : "google_unavailable",
                stage: ex is JsonException ? "response_parse" : "network");
            LogFailure(ex, error, tenantId);
            if (error.Message == "reconnect_required")
                await ClearSessionAsync(cancellationToken);
            return Fail(result, GoogleHealthErrorCode.Encode(
                error.Message,
                error.DataType is null ? null : [error.DataType]));
        }
        catch (Exception ex)
        {
            var diagnosticId = Guid.NewGuid().ToString("N")[..12];
            logger.LogError(ex,
                "Unexpected Google Health import failure for tenant {TenantId}; diagnostic {DiagnosticId}. Message: {ExceptionMessage}",
                tenantId, diagnosticId, ex.Message);
            return Fail(result, "internal_sync");
        }
        finally
        {
            gate.Release();
        }
    }

    private async Task<GoogleHealthTokenSession> SessionAsync(
        GoogleHealthConnectorConfiguration config,
        CancellationToken ct,
        bool forceRefresh = false)
    {
        if (string.IsNullOrWhiteSpace(config.RefreshToken))
            throw new GoogleHealthException("reconnect_required", stage: "session_read");

        var scopes = (config.GrantedScopes ?? string.Empty)
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        await oauth.SeedSessionAsync(new GoogleHealthTokenSession(config.RefreshToken, scopes));
        if (forceRefresh)
            oauth.InvalidateToken();

        var accessToken = await oauth.GetValidTokenAsync(config, ct);
        if (string.IsNullOrWhiteSpace(accessToken))
            throw new GoogleHealthException("invalid_token_response", stage: "token_refresh");

        var session = await oauth.GetCurrentSessionAsync() ??
            throw new GoogleHealthException("invalid_token_response", stage: "token_cache");
        await PersistSessionAsync(session, ct);
        return session;
    }

    private async Task ReadWithRefreshAsync(
            GoogleHealthConnectorConfiguration config,
            string accessToken,
            string[] active,
            DateTimeOffset from,
            DateTimeOffset to,
            Guid tenantId,
            SyncResult result,
            CancellationToken ct)
    {
        try
        {
            await ReadOnceAsync(config, accessToken, active, from, to, tenantId, result, ct);
        }
        catch (GoogleHealthException first) when (first.Message == "access_token_rejected")
        {
            logger.LogInformation(
                "Google Health access token was rejected for tenant {TenantId}; refreshing once",
                tenantId);
            coordinator.Report(tenantId, GoogleHealthSyncPhase.RefreshingSession);
            var refreshed = await SessionAsync(config, ct, forceRefresh: true);
            result.ItemsSynced.Clear();
            try
            {
                await ReadOnceAsync(config, refreshed.AccessToken!, active, from, to, tenantId, result, ct);
            }
            catch (GoogleHealthException second) when (second.Message == "access_token_rejected")
            {
                throw new GoogleHealthException("reconnect_required", stage: second.Stage,
                    dataType: second.DataType, providerReason: second.ProviderReason,
                    providerStatus: second.ProviderStatus);
            }
        }
    }

    private async Task ReadOnceAsync(
            GoogleHealthConnectorConfiguration config,
            string accessToken,
            string[] active,
            DateTimeOffset from,
            DateTimeOffset to,
            Guid tenantId,
            SyncResult result,
            CancellationToken ct)
    {
        foreach (var type in active)
            result.ItemsSynced[GoogleHealthClient.TryGetSyncDataType(type, out var dataType)
                ? dataType
                : throw new GoogleHealthException("unsupported_type")] = 0;
        for (var index = 0; index < active.Length; index++)
        {
            var type = active[index];
            var reconciliationRun = await writer.BeginReconciliationAsync([type], from, to, ct);
            try
            {
                    coordinator.Report(tenantId, GoogleHealthSyncPhase.Reading, type, index, active.Length, 0);
                    void PageRead(int pages)
                    {
                        coordinator.Report(tenantId, GoogleHealthSyncPhase.Reading, type, index, active.Length, pages);
                    }
                    if (type == "sleep")
                        await foreach (var page in google.ReadSleepPagesAsync(accessToken, from, to, ct, PageRead))
                        {
                            var unique = page.Where(session => !string.IsNullOrWhiteSpace(session.OriginalId))
                                .DistinctBy(session => session.OriginalId, StringComparer.Ordinal).ToArray();
                            await writer.StageReconciliationIdsAsync(
                                reconciliationRun, type,
                                unique.Select(session => session.OriginalId!).ToArray(), ct);
                            await writer.WriteAsync([], unique, config.BatchSize, ct);
                            result.ItemsSynced[SyncDataType.Sleep] =
                                result.ItemsSynced.GetValueOrDefault(SyncDataType.Sleep) + unique.Length;
                        }
                    else if (type == "heart-rate")
                    {
                        // Google Health reports heart rate at near-continuous (often per-beat) cadence.
                        // Storing every sample is not useful for reports and multiplies row counts far
                        // beyond what's needed, so the whole day's readings are aggregated to one
                        // average-bpm value per UTC minute before staging and writing them.
                        var raw = new List<GoogleHealthReading>();
                        await foreach (var page in google.ReadPagesAsync(accessToken, type, from, to, ct, PageRead))
                            raw.AddRange(page);
                        var unique = AggregateHeartRatePerMinute(raw);
                        await writer.StageReconciliationIdsAsync(
                            reconciliationRun, type,
                            unique.Select(GoogleHealthClient.Key).ToArray(), ct);
                        await writer.WriteAsync(unique, [], config.BatchSize, ct);
                        AddCount(result, type, unique.Count);
                    }
                    else
                        await foreach (var page in google.ReadPagesAsync(accessToken, type, from, to, ct, PageRead))
                        {
                            var unique = page.DistinctBy(GoogleHealthClient.Key, StringComparer.Ordinal).ToArray();
                            await writer.StageReconciliationIdsAsync(
                                reconciliationRun, type,
                                unique.Select(GoogleHealthClient.Key).ToArray(), ct);
                            await writer.WriteAsync(unique, [], config.BatchSize, ct);
                            AddCount(result, type, unique.Length);
                        }
                    coordinator.Report(tenantId, GoogleHealthSyncPhase.Integrating, type, index, active.Length);
                    await writer.CompleteReconciliationAsync(reconciliationRun, ct);
                    coordinator.Report(tenantId, GoogleHealthSyncPhase.Reading, type, index + 1, active.Length);
            }
            catch
            {
                try
                {
                    using var cleanup = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                    await writer.AbandonReconciliationAsync(reconciliationRun, cleanup.Token);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Could not clean up Google Health staging run {RunId}", reconciliationRun);
                }
                throw;
            }
        }
    }

    private async Task PersistSessionAsync(GoogleHealthTokenSession session, CancellationToken ct)
    {
        var secrets = await connectorConfigurations.GetSecretsAsync(ConnectorName, ct);
        var scopes = string.Join(' ', session.Scopes.Distinct(StringComparer.Ordinal));
        if (secrets.GetValueOrDefault("refreshToken") == session.RefreshToken &&
            secrets.GetValueOrDefault("grantedScopes") == scopes)
            return;
        secrets["refreshToken"] = session.RefreshToken;
        secrets["grantedScopes"] = scopes;
        await connectorConfigurations.SaveSecretsAsync(ConnectorName, secrets, ct: ct);
    }

    private async Task ClearSessionAsync(CancellationToken ct)
    {
        oauth.InvalidateToken();
        var secrets = await connectorConfigurations.GetSecretsAsync(ConnectorName, ct);
        secrets.Remove("refreshToken");
        secrets.Remove("grantedScopes");
        await connectorConfigurations.SaveSecretsAsync(ConnectorName, secrets, ct: ct);
    }

    private async Task ConsumeImportFromAsync(CancellationToken ct)
    {
        var stored = await connectorConfigurations.GetConfigurationAsync(ConnectorName, ct);
        if (stored is null) return;
        using var document = JsonDocument.Parse(stored.Configuration.RootElement.GetRawText());
        var configuration = document.RootElement.Deserialize<Dictionary<string, JsonElement>>() ?? [];
        configuration["importFrom"] = JsonSerializer.SerializeToElement<string?>(null);
        using var updated = JsonSerializer.SerializeToDocument(configuration);
        await connectorConfigurations.SaveConfigurationAsync(ConnectorName, updated, ct: ct);
    }

    /// <summary>
    ///     Collapses near-continuous raw heart-rate samples into one representative average-bpm
    ///     reading per UTC minute, keyed by a stable per-minute identifier so a re-import of the same
    ///     day updates the same aggregated record instead of accumulating duplicates.
    /// </summary>
    private static List<GoogleHealthReading> AggregateHeartRatePerMinute(IReadOnlyList<GoogleHealthReading> readings)
    {
        const long bucketMillis = 60_000L;
        return readings
            .GroupBy(reading => reading.Mills - (reading.Mills % bucketMillis))
            .Select(bucket =>
            {
                var representative = bucket.OrderBy(reading => reading.Mills).First();
                return new GoogleHealthReading
                {
                    DataType = representative.DataType,
                    OriginalId = $"minute:{bucket.Key}",
                    Mills = bucket.Key,
                    UtcOffsetMinutes = representative.UtcOffsetMinutes,
                    Value = Math.Round(bucket.Average(reading => reading.Value), MidpointRounding.AwayFromZero),
                    Unit = representative.Unit
                };
            })
            .OrderBy(reading => reading.Mills)
            .ToList();
    }

    private static void AddCount(SyncResult result, string type, int count) =>
        result.ItemsSynced[GoogleHealthClient.TryGetSyncDataType(type, out var dataType)
            ? dataType
            : throw new GoogleHealthException("unsupported_type")] =
            result.ItemsSynced.GetValueOrDefault(dataType) + count;

    private static SyncResult Complete(SyncResult result, string message = "")
    {
        result.Success = true;
        result.Message = message;
        result.EndTime = DateTimeOffset.UtcNow;
        return result;
    }

    private static SyncResult Fail(SyncResult result, string code)
    {
        result.Success = false;
        result.Message = code;
        result.Errors.Add(code);
        result.EndTime = DateTimeOffset.UtcNow;
        return result;
    }

    private void LogFailure(Exception ex, GoogleHealthException error, Guid tenantId) => logger.LogError(ex,
        "Google Health import failed for tenant {TenantId} with code {Code} at stage {Stage} for data type {DataType}; provider status {ProviderStatus}, provider reason {ProviderReason}",
        tenantId, error.Message, error.Stage, error.DataType, error.ProviderStatus, error.ProviderReason);
}

public static class GoogleHealthErrorCode
{
    public static string Encode(string code, IEnumerable<string>? dataTypes = null)
    {
        var types = dataTypes?
            .Where(type => GoogleHealthClient.SupportedTypes.Contains(type, StringComparer.Ordinal))
            .Distinct(StringComparer.Ordinal)
            .ToArray() ?? [];
        return types.Length == 0 ? code : $"{code}:{string.Join(',', types)}";
    }

    public static (string? Code, string[] DataTypes) Decode(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return (null, []);
        var separator = value.IndexOf(':');
        if (separator < 0) return (value, []);
        return (value[..separator], value[(separator + 1)..]
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(type => GoogleHealthClient.SupportedTypes.Contains(type, StringComparer.Ordinal))
            .Distinct(StringComparer.Ordinal)
            .ToArray());
    }
}
