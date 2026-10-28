namespace Nocturne.API.Middleware;

/// <summary>
/// When a credential or membership presented on a request is stamped as last used.
/// </summary>
/// <remarks>
/// The stamp is a write on its own context, so stamping every request would open a context for each
/// one. Once per <see cref="Interval"/> is as precise as the "Last active" lines that read it need.
/// </remarks>
internal static class LastUsedStamp
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    /// <summary>Whether a row last stamped at <paramref name="lastUsedAt"/> is due a new stamp.</summary>
    internal static bool IsDue(DateTime? lastUsedAt, DateTime now) =>
        lastUsedAt is not { } last || now - last > Interval;
}
