import type { HelpArticle } from "./documentation-types";
import { guide } from "./guide.svelte";

export function workflowArticles(): HelpArticle[] {
  return [
    {
      ...guide(
        "/help/getting-started",
        "Getting Started",
        "Learn how to configure display settings, connect data sources, and verify that your imported data appears correctly in Nocturne.",
        "The selected tenant, saved display preferences and records received from your configured uploaders and connectors.",
        "Open help with the book beside Nocturne, or press I, D or H when you are not typing in a field. Close it with the close button or Escape to return to your original page and inputs. Appearance controls units, theme, language and help display.",
        "After connecting a source, use Dashboard to check freshness and Reports to review the selected period. Therapy shows imported schedules. Sharing & Privacy manages access.",
        "Available settings depend on your permissions. A connected status or completed setup checklist does not prove that an import has finished. Check actual records and their timestamps.",
        [
          "/settings/appearance",
          "/settings/connectors",
          "/reports",
          "/help/troubleshooting",
        ]
      ),
      helpOnly: true,
      steps: [
        {
          title: "Choose your display",
          text: "Open Appearance to set units, theme, language and help display. Display preferences do not change the stored readings.",
        },
        {
          title: "Connect your data source",
          text: "Open Connectors & Apps and follow the guide for your source. Complete any required sign-in and import selection.",
        },
        {
          title: "Verify incoming data",
          text: "Check the latest reading timestamp on Dashboard, then confirm dates and data coverage in Reports. If records are missing, open Missing Data and Troubleshooting.",
        },
      ],
    },
    {
      ...guide(
        "/help/troubleshooting",
        "Missing Data and Troubleshooting",
        "Diagnose missing data by checking scope, source records, and import status. Prepare evidence for support without including sensitive credentials.",
        "Dashboard timestamps, the selected report period, connector status, source-app records and rejected-upload diagnostics.",
        "Check the selected tenant, report dates and applied filters first. In Connectors & Apps, inspect the source configuration and latest sync. Use Support & Community for version and issue-report details.",
        "Distinguish a date or access mismatch from missing source records, an incomplete import or a rejected upload before changing configuration.",
        "Reports require different combinations of glucose, treatments and device status. An empty page is not proof that no event occurred. Clearing diagnostics does not repair or retry an import.",
        [
          "/settings/connectors",
          "/reports/data-quality/rejected-uploads",
          "/settings/support",
        ]
      ),
      helpOnly: true,
      steps: [
        {
          title: "Check the workspace and period",
          text: "Confirm the tenant, latest reading timestamp, selected dates and filters. Check whether your access includes the data the report needs.",
        },
        {
          title: "Compare source and imported records",
          text: "Check that the record exists in the source app, then review the connector latest sync and supported data types. Inspect Rejected Uploads when an uploader reports success but a record is missing.",
        },
        {
          title: "Prepare a useful support report",
          text: "Include the page, selected dates, expected result, version and steps to reproduce. Review any exported diagnostics and remove passwords, tokens and identifiable health records before sharing.",
        },
      ],
    },
  ];
}
