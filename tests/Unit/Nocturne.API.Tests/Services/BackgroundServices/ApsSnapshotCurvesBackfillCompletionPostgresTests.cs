using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Nocturne.API.Services.BackgroundServices;
using Nocturne.Infrastructure.Data;
using Nocturne.Tests.Shared.Infrastructure;
using Npgsql;
using Xunit;

namespace Nocturne.API.Tests.Services.BackgroundServices;

/// <summary>
/// Two instances that finish the same tenant record it once, and the second write is not an error.
/// </summary>
[Trait("Category", "Integration")]
public class ApsSnapshotCurvesBackfillCompletionPostgresTests(
    ApsSnapshotCurvesBackfillCompletionPostgresTests.Database database)
    : IClassFixture<ApsSnapshotCurvesBackfillCompletionPostgresTests.Database>
{
    public sealed class Database : IAsyncLifetime
    {
        public string AppConnectionString { get; private set; } = string.Empty;
        public string MigratorConnectionString { get; private set; } = string.Empty;

        public async Task InitializeAsync()
        {
            var created = await SharedPostgres.CreateMigratedDatabaseAsync("aps_curves_backfill_completion");
            AppConnectionString = created.AppConnectionString;
            MigratorConnectionString = created.MigratorConnectionString;
        }

        public Task DisposeAsync() => Task.CompletedTask;
    }

    [Fact]
    public async Task A_second_completion_write_for_the_same_tenant_is_a_no_op()
    {
        var tenant = Guid.NewGuid();
        await using (var conn = new NpgsqlConnection(database.MigratorConnectionString))
        {
            await conn.OpenAsync();
            await using var insert = new NpgsqlCommand(
                "INSERT INTO tenants (id, slug, display_name, is_active, sys_created_at, sys_updated_at) VALUES (@id, @slug, 'T', true, now(), now())", conn);
            insert.Parameters.AddWithValue("id", tenant);
            insert.Parameters.AddWithValue("slug", tenant.ToString("N"));
            await insert.ExecuteNonQueryAsync();
        }

        var options = new DbContextOptionsBuilder<NocturneDbContext>().UseNpgsql(database.AppConnectionString).Options;
        await using (var first = new NocturneDbContext(options))
        {
            await ApsSnapshotCurvesBackfillService.RecordCompletionAsync(first, tenant, CancellationToken.None);
        }

        await using var db = new NocturneDbContext(options);
        var second = await Record.ExceptionAsync(() =>
            ApsSnapshotCurvesBackfillService.RecordCompletionAsync(db, tenant, CancellationToken.None));

        second.Should().BeNull();
        var rows = await db.BackfillCompletions.AsNoTracking().Where(c => c.TenantId == tenant).ToListAsync();
        rows.Should().ContainSingle().Which.Backfill.Should().Be(ApsSnapshotCurvesBackfillService.BackfillName);
    }
}
