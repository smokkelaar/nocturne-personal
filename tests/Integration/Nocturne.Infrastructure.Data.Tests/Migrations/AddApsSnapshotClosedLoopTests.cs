using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Nocturne.Infrastructure.Data.Interceptors;
using Npgsql;
using Nocturne.Tests.Shared.Infrastructure;

namespace Nocturne.Infrastructure.Data.Tests.Migrations;

/// <summary>
/// Runs <c>AddApsSnapshotClosedLoop</c> over Loop and oref snapshots and Loop settings stored as Loop
/// uploads them, in two tenants, then down and up again, on a real PostgreSQL.
/// </summary>
public class AddApsSnapshotClosedLoopFixture : IAsyncLifetime
{
    private const string MigrationUnderTest = "20261025092435_AddApsSnapshotClosedLoop";

    /// <summary>The migration immediately before the one under test.</summary>
    private const string PriorMigration = "20261025030315_AddTrackerInstanceRecordedAt";

    private string _migratorConnectionString = string.Empty;
    private string _superuserConnectionString = string.Empty;

    internal static readonly Guid TenantA = Guid.Parse("a1111111-1111-7111-8111-111111111111");
    internal static readonly Guid TenantB = Guid.Parse("b2222222-2222-7222-8222-222222222222");

    /// <summary>Tenant A's first Loop settings, in open loop.</summary>
    internal static readonly DateTime OpenFrom = new(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>Tenant A closes the loop, more than one backfill window after <see cref="OpenFrom"/>.</summary>
    internal static readonly DateTime ClosedFrom = new(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc);

    internal static readonly Guid BeforeAnySettings = Guid.Parse("c0000000-0000-7000-8000-000000000001");
    internal static readonly Guid AtOpenStart = Guid.Parse("c0000000-0000-7000-8000-000000000002");
    internal static readonly Guid OpenAWindowLater = Guid.Parse("c0000000-0000-7000-8000-000000000003");
    internal static readonly Guid JustBeforeClosed = Guid.Parse("c0000000-0000-7000-8000-000000000004");
    internal static readonly Guid AtClosedStart = Guid.Parse("c0000000-0000-7000-8000-000000000005");
    internal static readonly Guid ClosedLater = Guid.Parse("c0000000-0000-7000-8000-000000000006");
    internal static readonly Guid OrefInA = Guid.Parse("c0000000-0000-7000-8000-000000000007");
    internal static readonly Guid LoopInB = Guid.Parse("c0000000-0000-7000-8000-000000000008");
    internal static readonly Guid DeletedLoopInA = Guid.Parse("c0000000-0000-7000-8000-000000000009");

    internal Dictionary<Guid, bool?> AfterUp { get; } = [];
    internal Dictionary<Guid, bool?> AfterSecondUp { get; } = [];
    internal Dictionary<Guid, bool?> AfterRerun { get; } = [];
    internal Dictionary<Guid, bool?> AsSuperuser { get; } = [];
    internal bool ColumnAfterDown { get; private set; }

    public async Task InitializeAsync()
    {
        var database = await SharedPostgres.CreateEmptyDatabaseAsync("add_aps_snapshot_closed_loop");
        _migratorConnectionString = database.MigratorConnectionString;
        _superuserConnectionString = database.SuperuserConnectionString;

        await MigrateToAsync(PriorMigration);
        await SeedAsync();
        await MigrateToAsync(targetMigration: null);
        await ReadAsync(_migratorConnectionString, AfterUp);
        await MigrateToAsync(PriorMigration);
        ColumnAfterDown = await HasColumnAsync();
        await MigrateToAsync(targetMigration: null);
        await ReadAsync(_migratorConnectionString, AfterSecondUp);
        await ExecuteAsync(_migratorConnectionString, await UpSqlAsync());
        await ReadAsync(_migratorConnectionString, AfterRerun);
        await RunAsSuperuserAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task MigrateToAsync(string? targetMigration)
    {
        var options = new DbContextOptionsBuilder<NocturneDbContext>()
            .UseNpgsql(_migratorConnectionString, npgsql => npgsql.UseNocturneMigrations())
            .AddInterceptors(new TenantConnectionInterceptor())
            .Options;

        await using var context = new NocturneDbContext(options);
        await context.GetService<IMigrator>().MigrateAsync(targetMigration);
    }

    private async Task<string> UpSqlAsync()
    {
        var options = new DbContextOptionsBuilder<NocturneDbContext>()
            .UseNpgsql(_migratorConnectionString, npgsql => npgsql.UseNocturneMigrations())
            .Options;

        await using var context = new NocturneDbContext(options);
        var assembly = context.GetService<IMigrationsAssembly>();
        var migration = assembly.CreateMigration(
            assembly.Migrations[MigrationUnderTest], context.Database.ProviderName!);
        return migration.UpOperations.OfType<SqlOperation>().Single().Sql;
    }

    /// <summary>
    /// Clears every flag and reruns the backfill as the superuser, which bypasses RLS, in a
    /// transaction that is rolled back.
    /// </summary>
    private async Task RunAsSuperuserAsync()
    {
        await using var conn = new NpgsqlConnection(_superuserConnectionString);
        await conn.OpenAsync();
        await using var transaction = await conn.BeginTransactionAsync();
        await using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "UPDATE aps_snapshots SET closed_loop = NULL;\n" + await UpSqlAsync();
            await cmd.ExecuteNonQueryAsync();
        }

        await using (var read = conn.CreateCommand())
        {
            read.CommandText = "SELECT id, closed_loop FROM aps_snapshots;";
            await using var reader = await read.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                AsSuperuser[reader.GetGuid(0)] = reader.IsDBNull(1) ? null : reader.GetBoolean(1);
        }

        await transaction.RollbackAsync();
    }

    private async Task<bool> HasColumnAsync()
    {
        await using var conn = new NpgsqlConnection(_migratorConnectionString);
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            SELECT EXISTS (SELECT 1 FROM information_schema.columns
                           WHERE table_name = 'aps_snapshots' AND column_name = 'closed_loop');
            """;
        return (bool)(await cmd.ExecuteScalarAsync())!;
    }

    private static async Task ReadAsync(string connectionString, Dictionary<Guid, bool?> rows)
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        foreach (var tenant in new[] { TenantA, TenantB })
        {
            await using (var pin = conn.CreateCommand())
            {
                pin.CommandText = "SELECT set_config('app.current_tenant_id', @tenant, false);";
                pin.Parameters.AddWithValue("tenant", tenant.ToString());
                await pin.ExecuteNonQueryAsync();
            }

            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT id, closed_loop FROM aps_snapshots;";
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                rows[reader.GetGuid(0)] = reader.IsDBNull(1) ? null : reader.GetBoolean(1);
        }
    }

    private static async Task ExecuteAsync(string connectionString, string sql)
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        await cmd.ExecuteNonQueryAsync();
    }

    private async Task SeedAsync()
    {
        static string Settings(Guid tenant, string id, DateTime start, string loopSettings) =>
            $"""
             ('{id}', '{tenant}', '{start:O}', 'Default', 6, 20, 0, false, false, '{loopSettings}')
             """;

        static string Snapshot(Guid tenant, Guid id, DateTime at, string system) =>
            $"('{id}', '{tenant}', '{at:O}', '{system}', true)";

        const string open = """{"dosingEnabled": false, "deviceToken": "abc", "bundleIdentifier": "com.loopkit.Loop"}""";
        const string closed = """{"dosingEnabled": true, "deviceToken": "abc", "bundleIdentifier": "com.loopkit.Loop"}""";
        const string noDosing = """{"deviceToken": "abc", "bundleIdentifier": "com.loopkit.Loop"}""";

        await ExecuteAsync(_migratorConnectionString, $"""
            INSERT INTO tenants (id, slug, display_name, is_active, sys_created_at, sys_updated_at) VALUES
              ('{TenantA}', 'tenant-a', 'Tenant A', true, now(), now()),
              ('{TenantB}', 'tenant-b', 'Tenant B', true, now(), now());

            SELECT set_config('app.current_tenant_id', '{TenantA}', false);
            INSERT INTO therapy_settings
              (id, tenant_id, timestamp, profile_name, dia, carbs_hr, delay, is_default, is_externally_managed,
               loop_settings_json)
            VALUES
              {Settings(TenantA, "d0000000-0000-7000-8000-000000000001", OpenFrom, open)},
              {Settings(TenantA, "d0000000-0000-7000-8000-000000000002", ClosedFrom, closed)},
              {Settings(TenantA, "d0000000-0000-7000-8000-000000000003", ClosedFrom.AddDays(10), noDosing)};
            INSERT INTO aps_snapshots (id, tenant_id, timestamp, aps_system, enacted) VALUES
              {Snapshot(TenantA, BeforeAnySettings, OpenFrom.AddMinutes(-5), "Loop")},
              {Snapshot(TenantA, AtOpenStart, OpenFrom, "Loop")},
              {Snapshot(TenantA, OpenAWindowLater, OpenFrom.AddDays(35), "Loop")},
              {Snapshot(TenantA, JustBeforeClosed, ClosedFrom.AddMinutes(-5), "Loop")},
              {Snapshot(TenantA, AtClosedStart, ClosedFrom, "Loop")},
              {Snapshot(TenantA, ClosedLater, ClosedFrom.AddDays(20), "Loop")},
              {Snapshot(TenantA, OrefInA, ClosedFrom.AddDays(1), "Trio")};

            INSERT INTO aps_snapshots (id, tenant_id, timestamp, aps_system, enacted, deleted_at) VALUES
              ('{DeletedLoopInA}', '{TenantA}', '{ClosedFrom.AddDays(2):O}', 'Loop', true, now());

            SELECT set_config('app.current_tenant_id', '{TenantB}', false);
            INSERT INTO aps_snapshots (id, tenant_id, timestamp, aps_system, enacted) VALUES
              {Snapshot(TenantB, LoopInB, ClosedFrom.AddDays(1), "Loop")};

            SELECT set_config('app.current_tenant_id', '', false);
            """);
    }
}

/// <inheritdoc cref="AddApsSnapshotClosedLoopFixture"/>
[Trait("Category", "Integration")]
public class AddApsSnapshotClosedLoopTests(AddApsSnapshotClosedLoopFixture fixture)
    : IClassFixture<AddApsSnapshotClosedLoopFixture>
{
    private static Dictionary<Guid, bool?> Expected => new()
    {
        [AddApsSnapshotClosedLoopFixture.BeforeAnySettings] = null,
        [AddApsSnapshotClosedLoopFixture.AtOpenStart] = false,
        [AddApsSnapshotClosedLoopFixture.OpenAWindowLater] = false,
        [AddApsSnapshotClosedLoopFixture.JustBeforeClosed] = false,
        [AddApsSnapshotClosedLoopFixture.AtClosedStart] = true,
        [AddApsSnapshotClosedLoopFixture.ClosedLater] = true,
        [AddApsSnapshotClosedLoopFixture.OrefInA] = null,
        [AddApsSnapshotClosedLoopFixture.LoopInB] = null,
        [AddApsSnapshotClosedLoopFixture.DeletedLoopInA] = null,
    };

    [Fact]
    public void Each_Loop_snapshot_takes_the_dosingEnabled_of_the_Loop_settings_in_force_and_others_stay_null()
    {
        fixture.AfterUp.Should().BeEquivalentTo(Expected,
            "settings with no dosingEnabled change nothing, an oref or deleted snapshot is never stamped, and tenant B has no Loop settings");
    }

    [Fact]
    public void Down_drops_the_column_and_up_again_or_a_rerun_gives_the_same_flags()
    {
        fixture.ColumnAfterDown.Should().BeFalse();
        fixture.AfterSecondUp.Should().BeEquivalentTo(Expected);
        fixture.AfterRerun.Should().BeEquivalentTo(Expected);
    }

    [Fact]
    public void Run_as_a_role_that_bypasses_rls_no_tenant_is_stamped_from_another_tenants_settings()
    {
        fixture.AsSuperuser.Should().BeEquivalentTo(Expected);
    }
}
