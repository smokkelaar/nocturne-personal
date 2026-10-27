using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nocturne.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTrackerCovers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "covers",
                table: "tracker_definitions",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "device_component",
                table: "tracker_definitions",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            // A site tracker restarted by Pod Change and not by Cannula Change follows a pod, which is
            // the site, the insulin and the battery: it moves to the Pod category (8) and covers all
            // three. The generic infusion-site tracker also restarts on Pod Change, but on Cannula
            // Change too, and stays a site. Equil was catalogued as a pod but is not one, so its
            // trackers are left as they are. FORCE ROW LEVEL SECURITY needs the tenant set.
            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    t RECORD;
                BEGIN
                    FOR t IN SELECT id FROM tenants LOOP
                        PERFORM set_config('app.current_tenant_id', t.id::text, true);

                        UPDATE tracker_definitions
                        SET category = 8,
                            covers = '["Site","Reservoir","Power"]'::jsonb
                        WHERE category = 6
                          AND trigger_event_types @> '["Pod Change"]'::jsonb
                          AND NOT trigger_event_types @> '["Cannula Change"]'::jsonb
                          AND name NOT ILIKE 'equil%';
                    END LOOP;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    t RECORD;
                BEGIN
                    FOR t IN SELECT id FROM tenants LOOP
                        PERFORM set_config('app.current_tenant_id', t.id::text, true);

                        UPDATE tracker_definitions SET category = 6 WHERE category = 8;
                    END LOOP;
                END $$;
                """);

            migrationBuilder.DropColumn(
                name: "covers",
                table: "tracker_definitions");

            migrationBuilder.DropColumn(
                name: "device_component",
                table: "tracker_definitions");
        }
    }
}
