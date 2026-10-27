using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nocturne.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTrackerEndEventTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "end_event_types",
                table: "tracker_definitions",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            // A pod tracker follows Pod Activated / Pod Deactivated as well as Pod Change: MyLife and
            // Glooko report a pod change as that pair. FORCE ROW LEVEL SECURITY needs the tenant set.
            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    t RECORD;
                BEGIN
                    FOR t IN SELECT id FROM tenants LOOP
                        PERFORM set_config('app.current_tenant_id', t.id::text, true);

                        UPDATE tracker_definitions
                        SET trigger_event_types = CASE
                                WHEN trigger_event_types @> '["Pod Activated"]'::jsonb THEN trigger_event_types
                                ELSE trigger_event_types || '["Pod Activated"]'::jsonb
                            END,
                            end_event_types = '["Pod Deactivated"]'::jsonb
                        WHERE trigger_event_types @> '["Pod Change"]'::jsonb;
                    END LOOP;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "end_event_types",
                table: "tracker_definitions");
        }
    }
}
