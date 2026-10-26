import type { HelpArticle } from "./documentation-types";
import { guide } from "./guide.svelte";

export function workflowArticles(): HelpArticle[] {
  return [
    {
      ...guide(
        "/reports/loop-analysis/daily-profile",
        "Daily Profile",
        "Compare glucose, basal, loop corrections, insulin on board (IOB) and carbs on board (COB) across the time of day.",
        "Uploaded glucose, treatment, and device-status records.",
        "Choose the report dates and filters. They stay selected when you switch to another Loop Analysis page. Ranges longer than 90 days use the most recent 90 days of the selected range.",
        "Compare daily patterns across the recorded signals, then open Insulin Delivery for the same dates to inspect delivery context.",
        "Aggregated patterns are not one actual day or proof of actual delivery.",
        [
          "/reports/loop-analysis",
          "/reports/insulin-delivery",
          "/reports/day-in-review",
          "/settings/profile",
        ]
      ),
      visual: "spread",
      reading: [
        {
          title: "Choose a period",
          text: "Check the selected dates and applied filters before reading the daily pattern.",
        },
        {
          title: "Compare the signals",
          text: "Look at glucose, basal, corrections, IOB and COB at the same time of day. Check coverage before comparing periods.",
        },
        {
          title: "Inspect actual days",
          text: "A daily profile combines multiple days. Use Day in Review and Insulin Delivery to inspect the recorded detail behind a pattern.",
        },
      ],
      settings: ["/settings/connectors", "/settings/profile"],
    },
    {
      ...guide(
        "/reports/loop-analysis/meals-and-events",
        "Meals and Events",
        "Align glucose and insulin before and after meals, corrections, and events.",
        "Recorded meals, corrections and other events, together with uploaded glucose and insulin records.",
        "Choose the report dates, then select event kinds and available conditions in the event cohort builder. Review the applied filters and server-reported limits.",
        "Compare the time before and after the selected events. Unavailable filters are removed from the selection rather than silently applied.",
        "Missing or incorrectly timed events can change the comparison. A similar glucose pattern does not prove that an event caused it.",
        ["/reports/loop-analysis", "/reports/treatments"]
      ),
      visual: "trend",
      reading: [
        {
          title: "Build Cohort",
          text: "Select event kinds and conditions in the builder.",
        },
        {
          title: "Check Filters",
          text: "Review server-reported applied filters and limits.",
        },
        {
          title: "Interpret Results",
          text: "View alignments. Remember association does not prove causation.",
        },
      ],
      settings: ["/settings/connectors", "/settings/profile"],
    },
    {
      ...guide(
        "/reports/loop-analysis/prediction-accuracy",
        "Prediction Accuracy",
        "Compare uploaded loop glucose predictions with subsequent readings.",
        "Uploaded loop predictions and subsequent glucose readings.",
        "Choose the shared report dates and filters, then review the available prediction comparisons.",
        "Matches predictions to subsequent readings within the selected period.",
        "Predictions need subsequent glucose readings for comparison. Missing pairs reduce coverage. This retrospective report does not guarantee the next reading or recommend a dose.",
        ["/reports/loop-analysis", "/reports/readings"]
      ),
      visual: "scatter",
      reading: [
        {
          title: "Keep the period consistent",
          text: "Use the same report dates and filters when comparing this page with the other Loop Analysis pages.",
        },
        {
          title: "Check available pairs",
          text: "Compare uploaded predictions with the glucose readings that followed them. Missing predictions or readings limit the comparison.",
        },
        {
          title: "Read the result in context",
          text: "Use the comparison to inspect past prediction behaviour, rather than treating a past match as a guarantee of a future reading.",
        },
      ],
      settings: ["/settings/connectors", "/settings/profile"],
    },
    {
      ...guide(
        "/reports/loop-analysis/loop-health",
        "Loop Health",
        "Inspect recorded closed-loop activity, interruptions and the limits reported by the loop.",
        "Uploaded loop and device-status records provide activity history, with glucose records for context.",
        "Choose the shared report dates and filters. For a period longer than 90 days, only the most recent 90 days of that selection are used.",
        "Shows recorded closed-loop time, reasons the loop stopped, and frequency of reaching limits.",
        "A missing or hidden value is not a measured zero. Missing status records do not prove a device fault. The report displays uploaded history and does not control the pump.",
        [
          "/reports/loop-analysis",
          "/reports/day-in-review",
          "/settings/connectors",
        ]
      ),
      visual: "bars",
      reading: [
        {
          title: "Check the analysed period",
          text: "Review the selected dates, filters and available status coverage before comparing activity shares.",
        },
        {
          title: "Review activity and gaps",
          text: "Inspect closed-loop time, recorded interruptions and limit frequency. Open linked days to examine a gap in context.",
        },
        {
          title: "Distinguish unknown from zero",
          text: "Read the reason shown for an unknown value. Check the uploader, connector and source app if status history is missing.",
        },
      ],
      settings: ["/settings/connectors", "/settings/profile"],
    },
    {
      ...guide(
        "/reports/loop-analysis/settings-evidence",
        "Settings Evidence",
        "Compare imported settings with stored observations.",
        "Profiles, glucose, treatments, and loop/device status.",
        "Use the shared report dates and filters to select the observations. Inspect the historical profile context and the records behind a comparison.",
        "Compares imported profile settings with observations in stored data.",
        "Missing records and historical profiles matter. No automatic therapy adjustment. Discuss changes with your diabetes care team.",
        ["/reports/loop-analysis", "/settings/profile"]
      ),
      visual: "stairs",
      reading: [
        {
          title: "Verify coverage",
          text: "Check which glucose, treatment, device-status and profile records are available in the selected period.",
        },
        {
          title: "Inspect the historical context",
          text: "Compare observations with the profile active at that time. Missing records can limit what the report can show.",
        },
        {
          title: "Discuss changes with your care team",
          text: "This page provides retrospective observations, not an automatic therapy adjustment. Discuss any proposed setting changes with your diabetes care team.",
        },
      ],
      settings: ["/settings/connectors", "/settings/profile"],
    },
    {
      ...guide(
        "/reports/data-quality/rejected-uploads",
        "Rejected Uploads",
        "View records Nocturne acknowledged but could not store.",
        "Uploader submissions that Nocturne acknowledged but could not store as sent. An uploader may therefore consider a missing record saved.",
        "Use Previous and Next to move through pages of 25 records. Export this page downloads the visible rows as JSON. Clear this page asks for confirmation before removing those diagnostics.",
        "Inspect the source, reason, last-sent time, occurrence count and payload to find records missing from the stored data. Repeated identical submissions are grouped.",
        "Clearing diagnostics does not repair, import or retry records. Long payload text is shortened in the list and export. Exported records may include identifiable health information.",
        [
          "/reports/data-quality",
          "/settings/connectors",
          "/help/troubleshooting",
        ]
      ),
      visual: "flow",
      reading: [
        {
          title: "Inspect the rejection",
          text: "Review the source, reason, occurrence count and record payload. A successful uploader response does not prove that this rejected record was stored.",
        },
        {
          title: "Correct the source and verify",
          text: "Check the uploader or source configuration, then confirm that new records appear. Clearing the list does not trigger another upload.",
        },
        {
          title: "Export only what you need",
          text: "Export this page contains only the visible rows and may contain shortened payloads. Review and redact the JSON before sharing it with support.",
        },
      ],
      settings: ["/settings/connectors"],
    },
    {
      ...guide(
        "/help/getting-started",
        "Getting Started",
        "Learn how to configure display settings, connect data sources, and verify that your imported data appears correctly in Nocturne.",
        "The selected tenant, saved display preferences and records received from your configured uploaders and connectors.",
        "Open help with the book beside Nocturne. Close it with the close button or Escape to return to your original page and inputs. Appearance controls units, theme, language and help display.",
        "After connecting a source, use Dashboard to check freshness and Reports to review the selected period. Therapy shows imported schedules; Sharing & Privacy manages access.",
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
