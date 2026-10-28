using System.ComponentModel.DataAnnotations.Schema;

namespace Nocturne.Infrastructure.Data.Entities;

/// <summary>
/// Records that a startup backfill has walked a tenant's data to the end, so a restart skips it.
/// </summary>
/// <remarks>
/// Not tenant-scoped (no RLS): the backfill reads it across tenants, and a row holds a backfill
/// name and a tenant id, no health data.
/// </remarks>
[Table("backfill_completions")]
public class BackfillCompletionEntity
{
    /// <summary>The backfill's name.</summary>
    [Column("backfill")]
    public string Backfill { get; set; } = string.Empty;

    /// <summary>The tenant the backfill completed for.</summary>
    [Column("tenant_id")]
    public Guid TenantId { get; set; }

    /// <summary>When the backfill finished the tenant.</summary>
    [Column("completed_at")]
    public DateTime CompletedAt { get; set; }
}
