using System.Data.Common;
using Npgsql;

namespace Nocturne.Infrastructure.Data.Configuration;

/// <summary>
/// Runtime-pool connection tuning applied to the app <see cref="NpgsqlDataSource"/> at startup.
/// Kept separate from the migrator data source, which must remain uncapped.
/// </summary>
internal static class PostgresRuntimeOptions
{
    /// <summary>
    /// Builds the runtime app <see cref="NpgsqlDataSource"/> — the singleton that owns the
    /// connection pool — with the pool bounds, idle lifetime, statement preparation and
    /// statement timeout from <paramref name="config"/> applied.
    /// </summary>
    /// <param name="config">Runtime PostgreSQL configuration.</param>
    /// <returns>A data source configured for the runtime app pool.</returns>
    internal static NpgsqlDataSource BuildRuntimeDataSource(PostgreSqlConfiguration config)
    {
        if (config.MinPoolSize < 0)
        {
            throw new InvalidOperationException(
                $"PostgreSql:MinPoolSize must not be negative, but is {config.MinPoolSize}.");
        }

        if (config.ConnectionIdleLifetimeSeconds <= 0)
        {
            throw new InvalidOperationException(
                "PostgreSql:ConnectionIdleLifetimeSeconds must be greater than 0, "
                + $"but is {config.ConnectionIdleLifetimeSeconds}.");
        }

        var builder = new NpgsqlDataSourceBuilder(config.ConnectionString);
        var pool = builder.ConnectionStringBuilder;
        var named = ParseKeywords(config.ConnectionString);
        pool.MaxPoolSize = config.MaxPoolSize;
        if (!Names(named, "Minimum Pool Size", "Min Pool Size", "MinPoolSize"))
            pool.MinPoolSize = config.MinPoolSize;
        if (!Names(named, "Connection Idle Lifetime", "ConnectionIdleLifetime"))
            pool.ConnectionIdleLifetime = config.ConnectionIdleLifetimeSeconds;
        if (!Names(named, "Max Auto Prepare", "MaxAutoPrepare"))
            pool.MaxAutoPrepare = Math.Max(0, config.MaxAutoPrepare);
        ValidatePool(pool);
        ApplyStatementTimeout(pool, config.StatementTimeoutSeconds);
        ApplyIdleInTransactionTimeout(pool, config.IdleInTransactionTimeoutSeconds);
        return builder.Build();
    }

    private static void ValidatePool(NpgsqlConnectionStringBuilder pool)
    {
        if (pool.MinPoolSize > pool.MaxPoolSize)
        {
            throw new InvalidOperationException(
                $"PostgreSql:MinPoolSize must not exceed MaxPoolSize ({pool.MaxPoolSize}), "
                + $"but is {pool.MinPoolSize}.");
        }

        if (pool.ConnectionIdleLifetime < pool.ConnectionPruningInterval)
        {
            throw new InvalidOperationException(
                $"PostgreSql:ConnectionIdleLifetimeSeconds must be at least the connection pruning "
                + $"interval ({pool.ConnectionPruningInterval} s), but is {pool.ConnectionIdleLifetime}.");
        }
    }

    /// <summary>
    /// The keywords the operator's connection string sets itself, zero values included, which then
    /// win over the matching <see cref="PostgreSqlConfiguration"/> setting. Npgsql's own builder
    /// reports every keyword it knows as present, so only a plain parse can tell.
    /// </summary>
    private static DbConnectionStringBuilder ParseKeywords(string? connectionString)
        => new() { ConnectionString = connectionString ?? "" };

    private static bool Names(DbConnectionStringBuilder parsed, params string[] keywords)
        => keywords.Any(parsed.ContainsKey);

    /// <summary>
    /// Appends a server-side <c>idle_in_transaction_session_timeout</c> to the runtime pool's
    /// startup options, so a transaction left open by a fault is ended by PostgreSQL rather than
    /// holding its tenant's v3 history back (<see cref="HistoryHorizon"/>) and its locks for good.
    /// No Nocturne transaction waits between statements anywhere near that long. A non-positive
    /// value is a no-op.
    /// </summary>
    internal static void ApplyIdleInTransactionTimeout(
        NpgsqlConnectionStringBuilder builder,
        int idleInTransactionTimeoutSeconds)
    {
        if (idleInTransactionTimeoutSeconds <= 0)
        {
            return;
        }

        var option = $"-c idle_in_transaction_session_timeout={(long)idleInTransactionTimeoutSeconds * 1000}";
        builder.Options = string.IsNullOrWhiteSpace(builder.Options)
            ? option
            : $"{builder.Options} {option}";
    }

    /// <summary>
    /// Appends a server-side <c>statement_timeout</c> to the connection's startup options so every
    /// statement on the runtime pool is cancelled by PostgreSQL itself once it exceeds the cap —
    /// the hard backstop behind the client-side command timeout. Applied only to the runtime app
    /// pool; the migrator pool is left uncapped because migration DDL (e.g. building an index on a
    /// multi-million-row table) may legitimately run for minutes. A non-positive value is a no-op,
    /// leaving the server default (0, meaning no cap).
    /// </summary>
    /// <param name="builder">Connection string builder for the runtime data source.</param>
    /// <param name="statementTimeoutSeconds">The cap in seconds; non-positive disables it.</param>
    internal static void ApplyStatementTimeout(
        NpgsqlConnectionStringBuilder builder,
        int statementTimeoutSeconds)
    {
        if (statementTimeoutSeconds <= 0)
        {
            return;
        }

        // statement_timeout is USERSET, so nocturne_app may set it via the startup 'options'
        // packet. Bare integer is milliseconds. Append rather than overwrite so any existing
        // startup options survive.
        // Widened before scaling: the value is operator-supplied, and in int arithmetic the
        // product overflows above 2,147,483 seconds. Some inputs wrap negative and PostgreSQL
        // refuses them at connection open rather than at startup; worse, others wrap back into a
        // valid range and silently apply a timeout orders of magnitude shorter than asked for.
        var option = $"-c statement_timeout={(long)statementTimeoutSeconds * 1000}";
        builder.Options = string.IsNullOrWhiteSpace(builder.Options)
            ? option
            : $"{builder.Options} {option}";
    }
}
