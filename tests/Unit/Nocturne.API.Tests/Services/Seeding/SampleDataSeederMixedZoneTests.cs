using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;
using Moq;
using Nocturne.API.Services.Alerts;
using Nocturne.API.Services.Seeding;
using Nocturne.Core.Contracts.Glucose;
using Nocturne.Core.Contracts.Health;
using Nocturne.Core.Contracts.Multitenancy;
using Nocturne.Core.Contracts.Profiles;
using Nocturne.Core.Contracts.Sleep;
using Nocturne.Core.Contracts.Treatments;
using Nocturne.Core.Contracts.V4;
using Nocturne.Core.Contracts.V4.Repositories;
using Nocturne.Core.Models;
using Nocturne.Infrastructure.Data.Abstractions;
using Nocturne.Infrastructure.Data.Entities.V4;
using Nocturne.Core.Models.V4;
using Nocturne.Tests.Shared.Infrastructure;
using Xunit;

namespace Nocturne.API.Tests.Services.Seeding;

/// <summary>
/// A seed for a tenant whose patient record names Pacific/Auckland. The demo generator reads
/// wall-clock values as the process's own local zone, so the stream test gives the provider that same
/// zone: the stream then ends at the provider's instant, while the seeder's own rows follow the
/// tenant's day, whatever zone the machine runs in.
/// </summary>
public class SampleDataSeederMixedZoneTests : IDisposable
{
    private const string Auckland = "Pacific/Auckland";
    private static readonly Guid TenantId = Guid.Parse("0196a3f2-7b1e-7c3a-9d52-4e8f1a6b2c10");
    private static readonly DateTimeOffset Instant = new(2026, 3, 14, 20, 0, 0, TimeSpan.Zero);

    private readonly SqliteTestDatabase _db = TestDbContextFactory.CreateSqliteWithTenant(TenantId);
    private readonly List<Entry> _entries = [];
    private readonly FakeTimeProvider _time = new(Instant);

    public void Dispose() => _db.Dispose();

    private SampleDataSeeder CreateSeeder()
    {
        var tenant = new Mock<ITenantAccessor>();
        tenant.SetupGet(t => t.TenantId).Returns(TenantId);

        var entries = new Mock<IEntryService>();
        entries
            .Setup(e => e.CreateEntriesAsync(It.IsAny<IEnumerable<Entry>>(), It.IsAny<WriteOrigin>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IEnumerable<Entry> batch, WriteOrigin _, CancellationToken _) =>
            {
                var written = batch.ToList();
                _entries.AddRange(written);
                return new BulkWrite<Entry>(written, 0);
            });

        var treatments = new Mock<ITreatmentDecomposer>();
        treatments
            .Setup(d => d.DecomposeBatchAsync(It.IsAny<IReadOnlyList<Treatment>>(), It.IsAny<WriteOrigin>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DecompositionResult());

        var statuses = new Mock<IDeviceStatusDecomposer>();
        statuses
            .Setup(d => d.DecomposeBatchAsync(It.IsAny<IReadOnlyList<DeviceStatus>>(), It.IsAny<string?>(), It.IsAny<WriteOrigin>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DecompositionResult());

        return new SampleDataSeeder(
            tenant.Object,
            _db.ContextFactory.AsNocturneFactory(),
            entries.Object,
            Mock.Of<ITreatmentService>(),
            Mock.Of<ISleepService>(),
            Mock.Of<IHeartRateService>(),
            Mock.Of<IStepCountService>(),
            Mock.Of<ITrackerRepository>(),
            Mock.Of<IRuleScopeClassifier>(),
            Mock.Of<IProfileWriteService>(),
            statuses.Object,
            treatments.Object,
            Mock.Of<ITreatmentCache>(),
            Mock.Of<ICompressionLowDetectionService>(),
            Mock.Of<ICompressionLowService>(),
            Mock.Of<ICompressionLowRepository>(),
            _time,
            NullLoggerFactory.Instance,
            NullLogger<SampleDataSeeder>.Instance);
    }

    private async Task RecordZoneAsync(string zone)
    {
        await using var db = _db.CreateContext();
        db.PatientRecords.Add(new PatientRecordEntity { Id = Guid.CreateVersion7(), TenantId = TenantId, Timezone = zone });
        await db.SaveChangesAsync();
    }

    private Task SeedAsync(int days = 2) => CreateSeeder().SeedAsync(
        new TenantContext(TenantId, "test", "Test", true, false),
        days,
        ownerSubjectId: null);

    [Fact]
    public async Task The_generated_stream_ends_at_the_providers_instant_for_a_tenant_in_another_zone()
    {
        _time.SetLocalTimeZone(TimeZoneInfo.Local);
        await RecordZoneAsync(Auckland);

        await SeedAsync();

        var now = Instant.ToUnixTimeMilliseconds();
        var latest = _entries.Max(e => e.Mills);
        latest.Should().BeLessThanOrEqualTo(now, "no reading is stamped after now");
        latest.Should().BeGreaterThan(now - (long)TimeSpan.FromMinutes(15).TotalMilliseconds, "the stream runs to now, with no gap");
    }

    [Fact]
    public async Task The_seeders_own_rows_follow_the_zone_on_the_patient_record()
    {
        _time.SetLocalTimeZone(TimeZoneInfo.Utc);
        await RecordZoneAsync(Auckland);

        await SeedAsync();

        await using var db = _db.CreateContext();
        (await db.BodyWeights.AnyAsync(w => w.SyncIdentifier == "demo-weight-2026-03-15"))
            .Should().BeTrue("it is already Sunday in Auckland, though still Saturday on the host");
        (await db.TimezoneTimeline.Select(t => t.Timezone).Distinct().ToListAsync()).Should().BeEquivalentTo([Auckland]);
        (await db.PatientRecords.SingleAsync()).Timezone.Should().Be(Auckland);
    }

    [Fact]
    public async Task Without_a_recorded_zone_the_seed_lays_its_days_out_in_the_hosts()
    {
        _time.SetLocalTimeZone(TimeZoneInfo.Utc);
        await SeedAsync(days: 10);

        await using var db = _db.CreateContext();
        (await db.BodyWeights.AnyAsync(w => w.SyncIdentifier == "demo-weight-2026-03-15"))
            .Should().BeFalse("it is still Saturday on the host");
        (await db.BodyWeights.AnyAsync(w => w.SyncIdentifier == "demo-weight-2026-03-08")).Should().BeTrue();
    }
}
