import type { HelpSection, HelpVisualKind } from "./documentation-types";
interface ReadingGuide {
  visual: HelpVisualKind;
  reading: HelpSection[];
  settings: string[];
}
const entry = (
  visual: HelpVisualKind,
  settings: string[],
  steps: [string, string][]
): ReadingGuide => ({
  visual,
  settings,
  reading: steps.map(([title, text]) => ({ title, text })),
});

// Each page has its own short reading aid, rather than the same glossary repeated everywhere.
export function readingGuides(): Record<string, ReadingGuide> {
  return {
    "/": entry(
      "trend",
      ["/settings/appearance", "/settings/connectors", "/alerts"],
      [
        [
          "Start with freshness",
          "Check when the latest reading arrived before interpreting its value or direction.",
        ],
        [
          "Read the timeline",
          "Line points are glucose samples. Recorded treatments provide timing context.",
        ],
        [
          "Choose your display",
          "Use chart controls for the view and Appearance for units, theme, and widgets.",
        ],
      ]
    ),
    "/reports/loop-analysis": entry(
      "trend",
      ["/settings/connectors", "/settings/profile"],
      [
        [
          "Check the available records",
          "Confirm the selected dates and the availability of glucose, loop status and insulin uploads before you compare the pages.",
        ],
        [
          "Use the same filters",
          "All five pages use the same range and filters. Change the page with the page names below the header.",
        ],
        [
          "Inspect the detail",
          "Open individual days or events in Day in review. Discuss changes to your settings with your diabetes care team.",
        ],
      ]
    ),
    "/reports/loop-analysis/daily-profile": entry(
      "spread",
      ["/settings/profile", "/settings/connectors"],
      [
        [
          "Read your usual day",
          "The line is the median of all days at that time. The bands show the spread of the days.",
        ],
        [
          "Follow the correction",
          "The net loop correction shows when the loop added insulin to the schedule or removed it.",
        ],
        [
          "Open the days",
          "Select a time on a chart to list the days. Select a day to open it in Day in review.",
        ],
      ]
    ),
    "/reports/loop-analysis/meals-and-events": entry(
      "trend",
      ["/settings/profile", "/settings/connectors"],
      [
        [
          "Build a cohort",
          "Choose an event type, a time of day and, for meals, a carb amount. Add up to three cohorts.",
        ],
        [
          "Read the curves",
          "The dashed line at 0 is the event. Each color is one cohort, and its line is the median.",
        ],
        [
          "Check the events",
          "Sort the event list and open an event in Day in review to see what happened.",
        ],
      ]
    ),
    "/reports/loop-analysis/prediction-accuracy": entry(
      "bars",
      ["/settings/connectors"],
      [
        [
          "Read the bias",
          "Above zero, the predictions were too high. Below zero, they were too low.",
        ],
        [
          "Use the right horizon",
          "Only the horizon marked Settings signal says something about your settings.",
        ],
        [
          "Find the hours",
          "The heatmap shows the hours of the day when the predictions were off.",
        ],
      ]
    ),
    "/reports/loop-analysis/loop-health": entry(
      "bars",
      ["/settings/connectors", "/settings/profile"],
      [
        [
          "Read the tiles",
          "The tiles show how much of the time the loop, the CGM and the pump were active.",
        ],
        [
          "Find the hours",
          "The hourly charts show when the loop stopped insulin or reached maximum basal.",
        ],
        [
          "Inspect the gaps",
          "Open the longest gaps in Day in review to find their cause.",
        ],
      ]
    ),
    "/reports/loop-analysis/settings-evidence": entry(
      "stairs",
      ["/settings/profile"],
      [
        [
          "Compare line and dots",
          "The line is your profile setting. The dots are the observed values for each block of the day.",
        ],
        [
          "Check the confidence",
          "Low confidence means few or very different episodes. Select a row to see why.",
        ],
        [
          "Discuss before you change",
          "The figures are observations. Speak to your diabetes care team before you change a setting.",
        ],
      ]
    ),
    "/reports/data-quality/rejected-uploads": entry(
      "flow",
      ["/settings/connectors"],
      [
        [
          "Read the reason",
          "Each row shows when a record was last sent, how many times, from which uploader and why it was not stored.",
        ],
        [
          "Open the record",
          "Expand Record to see the data as the uploader sent it.",
        ],
        [
          "Export, then clear",
          "Export this page to keep a copy. Clear removes only the records on this page.",
        ],
      ]
    ),
    "/reports": entry(
      "flow",
      ["/settings/connectors", "/settings/appearance"],
      [
        [
          "Choose a question",
          "Use the summary for an overview, patterns for timing, and lifestyle reports for activity.",
        ],
        [
          "Choose dates",
          "The overview summarizes the selected period. Some detailed reports have their own filters.",
        ],
        [
          "Open the detail",
          "Follow the relevant report rather than trying to explain a change from one summary figure.",
        ],
      ]
    ),
    "/reports/executive-summary": entry(
      "bars",
      ["/settings/appearance", "/settings/connectors"],
      [
        [
          "Check coverage",
          "Read the reliability indicator before trusting the headline measures.",
        ],
        [
          "Read the summary",
          "Average, range percentages, and variation answer different questions.",
        ],
        [
          "Investigate a pattern",
          "Use AGP for typical timing and Day in Review for an actual day's events.",
        ],
      ]
    ),
    "/reports/agp": entry(
      "spread",
      ["/settings/appearance", "/settings/profile"],
      [
        [
          "Find the middle line",
          "The median describes the middle of the recorded values at each time of day.",
        ],
        [
          "Read the width",
          "A wider percentile envelope means more variation between days at that time.",
        ],
        [
          "Open an actual day",
          "AGP combines days. Use Day in Review to see the events behind an individual trace.",
        ],
      ]
    ),
    "/reports/glucose-distribution": entry(
      "bars",
      ["/settings/appearance", "/settings/connectors"],
      [
        [
          "Read the histogram",
          "Taller bars mean more recorded readings in that glucose interval.",
        ],
        [
          "Compare the spread",
          "A narrow cluster and a wide spread describe different degrees of variation.",
        ],
        [
          "Check hourly differences",
          "The hourly panel shows whether the overall distribution hides time-of-day differences.",
        ],
      ]
    ),
    "/reports/ehba1c": entry(
      "trend",
      ["/settings/appearance", "/settings/timezone"],
      [
        [
          "Read the latest estimate",
          "The large figure is the estimate for the most recent day with enough readings. The line shows how it changed over the years.",
        ],
        [
          "Compare with the zones",
          "The colored zones show the non-diabetic range, the type 1 target, elevated and very high values.",
        ],
        [
          "Add a lab result",
          "Enter the date of the blood draw and the value. The triangle then shows how closely the estimate follows the lab.",
        ],
      ]
    ),
    "/reports/year-overview": entry(
      "grid",
      ["/settings/appearance", "/settings/timezone", "/settings/connectors"],
      [
        [
          "Choose a metric",
          "Select Avg glucose, Time in range, Bolus, Basal, TDD or Carbs in the color panel. Each cell then shows that value for one day.",
        ],
        [
          "Read the colors",
          "The color bar shows which color belongs to which value. Use the focus window and Dim outside to highlight the values that matter to you.",
        ],
        [
          "Open a day",
          "Look for groups of days with the same color. Select a day to open it in Day in review.",
        ],
      ]
    ),
    "/reports/readings": entry(
      "trend",
      ["/settings/appearance", "/settings/connectors"],
      [
        [
          "Choose dates",
          "Select the interval you want to inspect on the chart.",
        ],
        [
          "Follow samples",
          "The line connects recorded points. A gap does not contain additional measurements.",
        ],
        [
          "Inspect context",
          "Use the chart's tracks and event details rather than treating every nearby event as a cause.",
        ],
      ]
    ),
    "/reports/day-in-review": entry(
      "trend",
      ["/settings/appearance", "/settings/profile"],
      [
        [
          "Pick the day",
          "Review one actual date instead of a typical-day average.",
        ],
        [
          "Align the events",
          "Compare treatment timestamps with the glucose trace and available device context.",
        ],
        [
          "Check the record",
          "If an event is wrong or missing, review Treatments or its source import.",
        ],
      ]
    ),
    "/reports/week-to-week": entry(
      "trend",
      ["/settings/appearance", "/settings/connectors"],
      [
        [
          "Compare the same weekday",
          "Each weekday curve summarizes readings from that part of the selected period.",
        ],
        [
          "Look for timing",
          "Notice consistent differences between weekdays before checking individual days.",
        ],
        [
          "Check coverage",
          "Sparse weekdays can differ because fewer readings were available.",
        ],
      ]
    ),
    "/reports/comparison": entry(
      "bars",
      ["/settings/appearance", "/settings/connectors"],
      [
        [
          "Choose A and B",
          "Select a preset or edit both periods and their labels.",
        ],
        [
          "Apply with Load",
          "Draft dates do not change the displayed results until Load. Swap exchanges the loaded periods.",
        ],
        [
          "Compare equivalent data",
          "Check duration, coverage, and source changes before interpreting a difference.",
        ],
      ]
    ),
    "/reports/hourly-stats": entry(
      "bars",
      ["/settings/appearance", "/settings/connectors"],
      [
        [
          "Read one hour",
          "Each bar groups that hour's readings across the selected days.",
        ],
        [
          "Read the composition",
          "The colored parts show how those readings are distributed between ranges.",
        ],
        [
          "Inspect the timing",
          "Use the hourly summaries to select a time window for the readings chart.",
        ],
      ]
    ),
    "/reports/data-quality": entry(
      "grid",
      ["/settings/data-quality", "/settings/connectors"],
      [
        [
          "Check the counts",
          "The figures show the compression lows that are pending, accepted or dismissed.",
        ],
        [
          "Choose the question",
          "Use Signal integrity for unstable readings, CGM comparison for two devices and Compression lows for suggestions.",
        ],
        [
          "Review before you decide",
          "Detection is a reason to inspect the readings. It is not proof that they are wrong.",
        ],
      ]
    ),
    "/reports/data-quality/sensor-integrity": entry(
      "grid",
      ["/settings/connectors"],
      [
        [
          "Find flagged windows",
          "The daily overview shows the days and times of flagged windows.",
        ],
        [
          "Inspect nearby glucose",
          "Read each flagged window together with the lows that followed it.",
        ],
        [
          "Check the sensor",
          "Many flagged windows close together can point to a sensor or placement problem.",
        ],
      ]
    ),
    "/reports/data-quality/cgm-comparison": entry(
      "scatter",
      ["/settings/connectors"],
      [
        [
          "Choose two devices",
          "Device is compared with your selected Reference. Both need readings in the chosen period.",
        ],
        [
          "Set Match within",
          "A larger tolerance admits readings farther apart in time.",
        ],
        [
          "Read the diagonal",
          "Points near equal values indicate closer agreement. Only paired samples enter this view.",
        ],
      ]
    ),
    "/reports/data-quality/compression-lows": entry(
      "trend",
      ["/settings/data-quality"],
      [
        [
          "Find a suggestion",
          "Filter by dates and review status, then select a suggested night.",
        ],
        [
          "Inspect the glucose",
          "Read the shape of the drop and the recovery time before you decide.",
        ],
        [
          "Accept or dismiss",
          "Accept marks a false low from pressure. Dismiss keeps it as a real low. Detection settings are separate.",
        ],
      ]
    ),
    "/reports/steps": entry(
      "bars",
      ["/settings/connectors/google-health"],
      [
        [
          "Read daily totals",
          "A day total summarizes imported step-count records for that date.",
        ],
        [
          "Read the timing",
          "The activity view shows when steps were recorded, rather than just the daily sum.",
        ],
        [
          "Check an empty day",
          "Confirm the source has records, Steps is selected for import, and the date range includes them.",
        ],
      ]
    ),
    "/reports/heart-rate": entry(
      "trend",
      ["/settings/connectors/google-health"],
      [
        [
          "Read the unit",
          "Heart rate is shown in beats per minute, not glucose units.",
        ],
        [
          "Follow the pattern",
          "Look at the timing of higher or lower recorded values across the selected days.",
        ],
        [
          "Remember sampling",
          "Google Health imports minute averages. Brief peaks and gaps can differ from your watch's display.",
        ],
      ]
    ),
    "/reports/sleep": entry(
      "stages",
      ["/settings/connectors/google-health"],
      [
        [
          "Compare sessions",
          "Duration and timing describe recorded nights, not a fixed universal sleep target.",
        ],
        [
          "Read stage composition",
          "The segments show the stages your source supplied. Missing stages are left unknown.",
        ],
        [
          "Open a night",
          "Use the night detail for its stage timeline and glucose during that sleep window.",
        ],
      ]
    ),
    "/reports/sleep/[date]": entry(
      "stages",
      ["/settings/connectors/google-health"],
      [
        [
          "Follow the hypnogram",
          "Each segment represents a reported sleep stage over time.",
        ],
        [
          "Check the window",
          "The glucose summary uses the selected sleep session's timestamps.",
        ],
        [
          "Return to the overview",
          "Use Sleep to compare this night with other dates.",
        ],
      ]
    ),
    "/reports/treatments": entry(
      "flow",
      ["/settings/profile", "/settings/connectors"],
      [
        [
          "Find an event",
          "Choose a category and use Search to narrow the treatment table.",
        ],
        [
          "Check its fields",
          "Inspect event type, time, insulin/carb units, and source before editing.",
        ],
        [
          "Save deliberately",
          "Add/edit and bulk deletion change the stored events used by other reports.",
        ],
      ]
    ),
    "/reports/basal-analysis": entry(
      "stairs",
      ["/settings/profile", "/settings/connectors"],
      [
        [
          "Separate rate and amount",
          "A basal rate describes delivery per hour. A delivered total describes accumulated insulin.",
        ],
        [
          "Compare schedule and records",
          "Profiles supply the schedule, while delivery and temporary-basal records describe changes.",
        ],
        [
          "Check missing context",
          "A missing historical profile or delivery interval leaves part of the analysis uncertain.",
        ],
      ]
    ),
    "/reports/insulin-delivery": entry(
      "bars",
      ["/settings/profile", "/settings/connectors"],
      [
        [
          "Compare basal and bolus",
          "The ratio chart shows their contribution to recorded delivery.",
        ],
        [
          "Inspect daily and hourly totals",
          "These views reveal different timing patterns within the selected period.",
        ],
        [
          "Check completeness",
          "Missing basal durations or bolus uploads can understate delivered totals.",
        ],
      ]
    ),
    "/reports/site-change-impact": entry(
      "trend",
      ["/settings/trackers", "/settings/connectors"],
      [
        [
          "Locate the change",
          "The comparison is centered on a recorded infusion-site change.",
        ],
        [
          "Read before and after",
          "Compare the available glucose in the surrounding windows.",
        ],
        [
          "Check event timing",
          "A missing or incorrectly dated site-change record makes the comparison less useful.",
        ],
      ]
    ),
    "/reports/idp": entry(
      "spread",
      ["/settings/profile", "/settings/connectors"],
      [
        [
          "Read the combined view",
          "Glucose patterns and delivery summaries share a daily time scale.",
        ],
        [
          "Separate planned and delivered",
          "Scheduled basal comes from the profile. Actual delivery needs imported insulin records.",
        ],
        [
          "Check individual panels",
          "A complete glucose trace does not guarantee complete treatment or profile data.",
        ],
      ]
    ),
    "/reports/battery": entry(
      "trend",
      ["/settings/connectors"],
      [
        [
          "Choose a device and period",
          "Review the available battery records in the report's selected window.",
        ],
        [
          "Check the latest upload",
          "An old value can describe an earlier battery state, not the current device.",
        ],
        [
          "Compare the source",
          "Different devices report battery differently and at different intervals.",
        ],
      ]
    ),
    "/calendar": entry(
      "grid",
      ["/settings/trackers", "/settings/timezone"],
      [
        [
          "Choose a month",
          "Move through months to see day summaries and due tracker events.",
        ],
        [
          "Read a day",
          "A daily summary condenses its available readings. Inspect a day for more detail.",
        ],
        [
          "Manage reminders elsewhere",
          "Tracker starts/completions affect due events. Edit definitions in Notifications & Trackers.",
        ],
      ]
    ),
    "/time-spans": entry(
      "stairs",
      ["/settings/connectors", "/settings/profile"],
      [
        [
          "Choose the interval",
          "Use the date range to find the device state you want to inspect.",
        ],
        [
          "Read a span",
          "A horizontal segment is a period in a state, rather than an individual reading.",
        ],
        [
          "Inspect transitions",
          "Check adjacent states and missing end times before interpreting duration.",
        ],
      ]
    ),
    "/clock": entry(
      "flow",
      ["/settings/appearance"],
      [
        [
          "Choose a face",
          "Preview a saved face or create a new configuration.",
        ],
        [
          "Configure its layout",
          "Open the face's editor for its widgets, sizing, and display options.",
        ],
        [
          "Check freshness",
          "The clock displays incoming records. Its appearance does not improve stale uploads.",
        ],
      ]
    ),
    "/food": entry(
      "flow",
      ["/settings/connectors"],
      [
        [
          "Find a food",
          "Search or filter the catalog before adding a duplicate entry.",
        ],
        [
          "Check portion and nutrition",
          "Carb values describe a portion. Verify both the amount and its unit.",
        ],
        [
          "Use it in a meal",
          "A catalog entry becomes meal context only when linked to recorded intake.",
        ],
      ]
    ),
    "/meals": entry(
      "flow",
      ["/settings/connectors"],
      [
        [
          "Find unassigned intake",
          "Use All or Unattributed, then narrow by date, Search, or Food.",
        ],
        [
          "Review a suggested match",
          "Inspect the meal and carb event before accepting a proposed attribution.",
        ],
        [
          "Adjust the link",
          "Add, edit, or remove the food association. This is distinct from deleting the glucose trace.",
        ],
      ]
    ),
    "/tools/packing": entry(
      "flow",
      ["/settings/trackers"],
      [
        [
          "Describe the trip",
          "Set the trip inputs before reading estimated supply quantities.",
        ],
        [
          "Review categories",
          "Check the estimate against your own devices and supply use.",
        ],
        [
          "Open the list",
          "Turn the estimate into a checklist, adding custom items where necessary.",
        ],
      ]
    ),
    "/tools/packing/list": entry(
      "flow",
      ["/settings/trackers"],
      [
        [
          "Review quantities",
          "The starting list reflects the trip calculation.",
        ],
        [
          "Add custom items",
          "Include supplies that the standard categories did not cover.",
        ],
        [
          "Check items physically",
          "A tick records your check. It does not verify the contents of your bag.",
        ],
      ]
    ),
    "/alerts": entry(
      "flow",
      ["/alerts/dnd", "/settings/connectors"],
      [
        [
          "Choose a rule",
          "Enable or edit the conditions that produce an alert.",
        ],
        [
          "Choose delivery",
          "Review the channels under Where alerts reach you and each rule's configuration.",
        ],
        [
          "Inspect actual fires",
          "History records evaluations/delivery. Acknowledging an alert is different from disabling its rule.",
        ],
      ]
    ),
    "/alerts/simulator": entry(
      "trend",
      ["/alerts"],
      [
        [
          "Select a rule",
          "Choose the rule whose behavior you want to inspect.",
        ],
        [
          "Choose a replay window",
          "Replay evaluates against a chosen historical scenario. It is not a new measurement.",
        ],
        [
          "Review the result",
          "Check the simulated fires before enabling the rule for live use.",
        ],
      ]
    ),
    "/alerts/history": entry(
      "flow",
      ["/alerts", "/alerts/dnd"],
      [
        [
          "Locate a fire",
          "Read the timestamp, rule, and severity of a recorded event.",
        ],
        [
          "Inspect delivery",
          "A rule firing and a notification being delivered are different stages.",
        ],
        [
          "Adjust the right control",
          "Change the condition in Rules or quiet periods in Do Not Disturb.",
        ],
      ]
    ),
    "/alerts/dnd": entry(
      "flow",
      ["/alerts", "/settings/patient"],
      [
        [
          "Choose manual or schedule",
          "Manual quiet mode and a recurring window serve different purposes.",
        ],
        [
          "Set timing",
          "Use Auto-expire for manual mode, or From/To for the recurring window.",
        ],
        [
          "Check exceptions",
          "Rules allowed through Do Not Disturb can still notify. Verify the patient's timezone.",
        ],
      ]
    ),
    "/compatibility": entry(
      "flow",
      [],
      [
        [
          "Set request filters",
          "Narrow by path, method, and match type to inspect a specific endpoint.",
        ],
        [
          "Read the differences",
          "Inspect matching and critical issues instead of relying only on the overall score.",
        ],
        [
          "Test a scenario",
          "Open Test Endpoint Compatibility to run a deliberate comparison.",
        ],
      ]
    ),
    "/compatibility/test": entry(
      "flow",
      [],
      [
        [
          "Choose a target",
          "Set the endpoint and parameters for the intended scenario.",
        ],
        [
          "Run the comparison",
          "Inspect both responses and timing rather than just a pass/fail headline.",
        ],
        [
          "Review coverage",
          "One matching scenario does not verify every uploader or data shape.",
        ],
      ]
    ),
    "/tenants": entry(
      "flow",
      ["/settings/members", "/settings/admin/tenants"],
      [
        [
          "Choose the workspace",
          "Each tile represents a tenant you are allowed to access.",
        ],
        [
          "Check identity",
          "Confirm the patient/workspace before opening its records.",
        ],
        [
          "Manage access separately",
          "Sharing & Privacy controls tenant membership. Platform administration controls tenant configuration.",
        ],
      ]
    ),
    "/setup": entry(
      "flow",
      ["/settings/patient", "/settings/connectors", "/settings/appearance"],
      [
        [
          "Complete identity",
          "Set up your account and select the correct patient workspace.",
        ],
        [
          "Connect a source",
          "Finish the provider's authentication and import selection, not just its setup form.",
        ],
        [
          "Verify real records",
          "Open a report containing dates where the source has data.",
        ],
      ]
    ),
    "/settings": entry(
      "flow",
      ["/settings/account", "/settings/patient", "/settings/connectors"],
      [
        [
          "Choose the scope",
          "Account belongs to you. Patient Record and connectors belong to the selected tenant.",
        ],
        [
          "Open a category",
          "Use its controls and field descriptions for the particular feature.",
        ],
        [
          "Verify the result",
          "A display change, a saved setting, and an imported record are different outcomes.",
        ],
      ]
    ),
    "/settings/account": entry(
      "flow",
      ["/settings/access"],
      [
        [
          "Check your identity",
          "These details describe the signed-in person, not the monitored patient.",
        ],
        [
          "Prepare recovery",
          "Register your chosen sign-in methods and save recovery codes privately.",
        ],
        [
          "Review sessions",
          "Active Access manages already-signed-in browsers separately from credentials.",
        ],
      ]
    ),
    "/settings/patient": entry(
      "flow",
      ["/settings/profile", "/settings/weight", "/settings/timezone"],
      [
        [
          "Check the patient",
          "Verify the workspace before editing clinical information.",
        ],
        [
          "Save changed details",
          "Weight is recorded into its history when changed. Timezone changes take effect from saving.",
        ],
        [
          "Manage related history",
          "Use Weight history and Timezone history for dated entries rather than overwriting a single current value.",
        ],
      ]
    ),
    "/settings/appearance": entry(
      "flow",
      [],
      [
        [
          "Choose units and theme",
          "These format your display rather than changing stored measurements.",
        ],
        [
          "Try help appearance",
          "Open the book and adjust layout, transparency, and blur with Display options.",
        ],
        [
          "Know where it is saved",
          "Documentation preferences are browser-local. Account display preferences have their own persistence.",
        ],
      ]
    ),
    "/settings/profile": entry(
      "stairs",
      ["/settings/connectors"],
      [
        [
          "Choose the profile",
          "Check which imported profile is default and when the schedule applies.",
        ],
        [
          "Read time segments",
          "Basal, sensitivity, carb ratio, and target can change by time of day.",
        ],
        [
          "Correct the origin",
          "When schedules are read-only here, edit the profile in the source app/device and sync again.",
        ],
      ]
    ),
    "/settings/data-quality": entry(
      "flow",
      ["/settings/connectors"],
      [
        [
          "Configure detection",
          "Set typical sleep times and automatic detection for review suggestions.",
        ],
        [
          "Inspect the result",
          "Open the quality reports to see what was flagged.",
        ],
        [
          "Separate cleanup",
          "Maintenance and accepting suggestions can change records. Merely changing detection settings is a different action.",
        ],
      ]
    ),
    "/settings/trackers": entry(
      "flow",
      ["/alerts"],
      [
        [
          "Define what is tracked",
          "Definitions set the duration/reminders. Presets reuse starting information.",
        ],
        [
          "Start an instance",
          "An active tracker measures time from its recorded start.",
        ],
        [
          "Complete the event",
          "Completion creates history. Editing a definition is not the same as completing an instance.",
        ],
      ]
    ),
    "/settings/access": entry(
      "flow",
      ["/settings/account", "/settings/connectors"],
      [
        ["Inspect sessions", "Find browsers signed in to your account."],
        [
          "Revoke unwanted access",
          "That session must authenticate again. Stored patient records remain.",
        ],
        [
          "Use the right list",
          "Uploader devices, authorized apps, and API tokens are managed in Connectors & Apps.",
        ],
      ]
    ),
    "/settings/connectors": entry(
      "flow",
      [],
      [
        [
          "Choose the data source",
          "A server connector reads a provider. An uploader pushes records. Authorized apps and tokens grant API access.",
        ],
        [
          "Finish its setup",
          "Configure and authenticate the source, then select imports where the connector requires it.",
        ],
        [
          "Check status and progress",
          "Configured, connected, syncing, and a completed historical import are different states.",
        ],
      ]
    ),
    "/settings/members": entry(
      "flow",
      ["/settings/access"],
      [
        [
          "Choose who has access",
          "Use memberships, invitations, and requests for named people.",
        ],
        [
          "Choose what they can do",
          "Roles, scopes, and time limits determine the available data and actions.",
        ],
        [
          "Review share links",
          "Anyone possessing a usable guest link receives its configured access. Revoke links you no longer intend to share.",
        ],
      ]
    ),
    "/settings/support": entry(
      "flow",
      [],
      [
        [
          "Identify the version",
          "Include the deployment version and relevant error code.",
        ],
        [
          "Describe reproduction",
          "State the page, steps, expected result, and observed result.",
        ],
        [
          "Review before sharing",
          "Check the optional device details and remove secrets or identifiable records from public reports.",
        ],
      ]
    ),
    "/settings/translations": entry(
      "flow",
      ["/settings/appearance"],
      [
        [
          "Choose a language",
          "Inspect the entries available for that catalog.",
        ],
        [
          "Preserve placeholders",
          "Keep interpolation and markup placeholders intact when editing a message.",
        ],
        [
          "Submit a contribution",
          "Contributor details and reviewer notes accompany your translation. Interface language is selected in Appearance.",
        ],
      ]
    ),
    "/settings/weight": entry(
      "trend",
      ["/settings/connectors/google-health"],
      [
        [
          "Inspect dated entries",
          "Weight history contains manual records and supported imports.",
        ],
        [
          "Add the right units",
          "Enter kilograms and the actual recording time, not today's date for an older measurement.",
        ],
        [
          "Manage imports separately",
          "Selecting Weight in Google Health controls imports. Editing a history entry is a different operation.",
        ],
      ]
    ),
    "/settings/timezone": entry(
      "flow",
      ["/settings/patient", "/settings/appearance"],
      [
        [
          "Add a location change",
          "Choose the timezone and local arrival date/time.",
        ],
        [
          "Keep history meaningful",
          "Dated locations explain local timing as the patient travels.",
        ],
        [
          "Use correction deliberately",
          "The Fix already-imported data action is separate from changing display formats. Use it to correct existing timestamps.",
        ],
      ]
    ),
    "/settings/migration": entry(
      "flow",
      ["/settings/connectors"],
      [
        [
          "Choose the source",
          "Set Nightscout API or MongoDB credentials and an optional date range.",
        ],
        [
          "Watch collections",
          "Inspect active progress and skipped-record notes, not just the final status.",
        ],
        [
          "Verify imported records",
          "Check representative dates in normal reports. Ongoing connector sync is configured separately.",
        ],
      ]
    ),
    "/settings/nightscout-transition": entry(
      "flow",
      ["/settings/migration", "/settings/connectors"],
      [
        [
          "Read transition status",
          "This page reflects the deployment's configured transition state.",
        ],
        [
          "Inspect migration",
          "Data Migration shows historical copy progress and errors.",
        ],
        [
          "Check ongoing uploads",
          "Connectors & Apps manages continuing data flow after migration.",
        ],
      ]
    ),
    "/settings/admin/tenants": entry(
      "flow",
      [],
      [
        [
          "Choose the tenant",
          "Confirm its name and slug before an administrative edit.",
        ],
        [
          "Check active status",
          "Tenant activation affects availability of that workspace.",
        ],
        [
          "Separate permissions",
          "Platform administrators and roles inside one tenant are different kinds of access.",
        ],
      ]
    ),
    "/settings/admin/connector-cursors": entry(
      "flow",
      ["/settings/connectors"],
      [
        [
          "Choose tenant and connector",
          "A reset acts on the selected source, not on all tenants.",
        ],
        ["Choose a lower bound", "Use the earliest date to read again."],
        [
          "Monitor the job",
          "Inspect progress or cancel the reset before starting another. Normal import duplicate protection applies.",
        ],
      ]
    ),
    "/settings/integrations/discord": entry(
      "flow",
      ["/settings/account"],
      [
        [
          "Link the identity",
          "Connect the intended Discord account to your Nocturne identity.",
        ],
        [
          "Choose the default",
          "Labels and default selection help distinguish linked accounts.",
        ],
        [
          "Revoke when needed",
          "Removing a link stops that authorization. It does not remove messages already sent.",
        ],
      ]
    ),
    "/settings/access-requests": entry(
      "flow",
      ["/settings/members"],
      [
        ["Inspect the requester", "Check the identity and requested access."],
        [
          "Approve or deny",
          "Apply the intended platform decision to the request.",
        ],
        [
          "Manage tenant membership",
          "Sharing & Privacy separately controls access to a patient's workspace.",
        ],
      ]
    ),
    "/settings/audit": entry(
      "flow",
      [],
      [
        [
          "Filter the history",
          "Choose the relevant period or action using the available controls.",
        ],
        [
          "Inspect an event",
          "Read the recorded actor, action, and affected configuration.",
        ],
        [
          "Understand retention",
          "Only actions recorded and retained by this server can appear.",
        ],
      ]
    ),
  };
}
