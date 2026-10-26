using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nocturne.Infrastructure.Data.Migrations
{
    /// <summary>
    /// Adds <c>closed_loop</c> to the APS snapshots and stamps the stored Loop snapshots from the
    /// <c>loopSettings.dosingEnabled</c> of the newest therapy settings starting at or before each,
    /// the rule <c>ApsSnapshotRepository.StampLoopClosedLoopAsync</c> keeps from here on. A snapshot
    /// older than every such version stays null. FORCE ROW LEVEL SECURITY binds the migrator, hence the
    /// per-tenant GUC; the tenant is named in every statement too, so a role that bypasses RLS still
    /// stamps each tenant from its own settings. A tenant with no Loop settings is skipped, and thirty
    /// days of live snapshots are written at a time, through the partial tenant timestamp index.
    /// </summary>
    public partial class AddApsSnapshotClosedLoop : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "closed_loop",
                table: "aps_snapshots",
                type: "boolean",
                nullable: true);

            migrationBuilder.Sql("""
                DO $$
                DECLARE
                    t RECORD;
                    first_at timestamptz;
                    last_at timestamptz;
                    window_start timestamptz;
                BEGIN
                    FOR t IN SELECT id FROM tenants LOOP
                        PERFORM set_config('app.current_tenant_id', t.id::text, true);

                        CONTINUE WHEN NOT EXISTS (
                            SELECT 1 FROM therapy_settings ts
                            WHERE ts.tenant_id = t.id
                              AND ts.deleted_at IS NULL
                              AND jsonb_typeof(ts.loop_settings_json -> 'dosingEnabled') = 'boolean');

                        SELECT min(a.timestamp), max(a.timestamp) INTO first_at, last_at
                        FROM aps_snapshots a
                        WHERE a.tenant_id = t.id AND a.deleted_at IS NULL AND a.aps_system = 'Loop';

                        window_start := first_at;
                        WHILE window_start <= last_at LOOP
                            WITH versions AS (
                                SELECT v.timestamp AS start, lead(v.timestamp) OVER (ORDER BY v.timestamp) AS next, v.closed
                                FROM (
                                    SELECT DISTINCT ON (ts.timestamp) ts.timestamp,
                                           (ts.loop_settings_json ->> 'dosingEnabled')::boolean AS closed
                                    FROM therapy_settings ts
                                    WHERE ts.tenant_id = t.id
                                      AND ts.deleted_at IS NULL
                                      AND jsonb_typeof(ts.loop_settings_json -> 'dosingEnabled') = 'boolean'
                                    ORDER BY ts.timestamp, ts.id DESC) v)
                            UPDATE aps_snapshots s
                            SET closed_loop = versions.closed
                            FROM versions
                            WHERE s.tenant_id = t.id
                              AND s.deleted_at IS NULL
                              AND s.aps_system = 'Loop'
                              AND s.timestamp >= window_start
                              AND s.timestamp < window_start + interval '30 days'
                              AND s.timestamp >= versions.start
                              AND (versions.next IS NULL OR s.timestamp < versions.next)
                              AND s.closed_loop IS DISTINCT FROM versions.closed;

                            window_start := window_start + interval '30 days';
                        END LOOP;
                    END LOOP;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "closed_loop",
                table: "aps_snapshots");
        }
    }
}
