using Nocturne.Services.Demo.Services;

namespace Nocturne.API.Services.Seeding;

/// <summary>
/// The two wall clocks of a seed run. Rows the seeder owns (weigh-ins, the timezone timeline, the
/// DND window, device start dates) are laid out in the tenant's zone, so "today" is the tenant's
/// local day. The demo generator reads every wall-clock value as host-local, so what it is given, or
/// must agree with, is laid out in the host's zone from the provider's <see cref="TimeProvider.LocalTimeZone"/>.
/// </summary>
internal sealed class SeedingClock
{
    private readonly TimeZoneInfo _hostZone;

    private SeedingClock(string zoneId, TimeZoneInfo zone, TimeZoneInfo hostZone, DateTime utcNow)
    {
        ZoneId = zoneId;
        Zone = zone;
        _hostZone = hostZone;
        UtcNow = utcNow;
    }

    /// <summary>The IANA id written to the patient record and the timezone timeline.</summary>
    public string ZoneId { get; }

    /// <summary>The zone <see cref="ZoneId"/> names.</summary>
    public TimeZoneInfo Zone { get; }

    /// <summary>The instant the run started.</summary>
    public DateTime UtcNow { get; }

    /// <summary>The tenant's wall-clock time at <see cref="UtcNow"/>, Unspecified kind.</summary>
    public DateTime LocalNow => Wall(UtcNow, Zone);

    /// <summary>The tenant's local midnight, Unspecified kind.</summary>
    public DateTime LocalToday => LocalNow.Date;

    /// <summary>The host's wall-clock time at <see cref="UtcNow"/>, Unspecified kind.</summary>
    public DateTime HostNow => Wall(UtcNow, _hostZone);

    /// <summary>The host's local midnight, Unspecified kind.</summary>
    public DateTime HostToday => HostNow.Date;

    /// <summary>
    /// Resolves the zone a seed lays its own rows out in: <paramref name="recordedZoneId"/> when the
    /// patient record already names a zone this host knows, else the host's zone, which the seed
    /// then writes to the record.
    /// </summary>
    public static SeedingClock Resolve(string? recordedZoneId, TimeProvider time)
    {
        var utcNow = time.GetUtcNow().UtcDateTime;

        if (recordedZoneId is { Length: > 0 } && TryFind(recordedZoneId) is { } recorded)
            return new SeedingClock(recordedZoneId, recorded, time.LocalTimeZone, utcNow);

        return new SeedingClock(
            DemoTherapyProfile.LocalIanaTimezone(), time.LocalTimeZone, time.LocalTimeZone, utcNow);
    }

    /// <summary>
    /// A tenant wall-clock time as UTC. A time that falls in a skipped hour reads at the standard
    /// offset instead of throwing, as <see cref="DateTime.ToUniversalTime"/> does.
    /// </summary>
    public DateTime ToUtc(DateTime local) => ToUtc(local, Zone);

    /// <summary>A host wall-clock time, as the demo generator reads it, as UTC.</summary>
    public DateTime HostToUtc(DateTime local) => ToUtc(local, _hostZone);

    /// <summary>A UTC time as a host wall-clock time, as the demo generator reads it.</summary>
    public DateTime UtcToHost(DateTime utc) => Wall(utc, _hostZone);

    private static DateTime Wall(DateTime utc, TimeZoneInfo zone) => DateTime.SpecifyKind(
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), zone),
        DateTimeKind.Unspecified);

    private static DateTime ToUtc(DateTime local, TimeZoneInfo zone)
    {
        var wall = DateTime.SpecifyKind(local, DateTimeKind.Unspecified);
        return DateTime.SpecifyKind(wall - zone.GetUtcOffset(wall), DateTimeKind.Utc);
    }

    private static TimeZoneInfo? TryFind(string id)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(id);
        }
        catch (TimeZoneNotFoundException)
        {
            return null;
        }
        catch (InvalidTimeZoneException)
        {
            return null;
        }
    }
}
