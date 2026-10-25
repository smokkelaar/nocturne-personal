export function reportContext(): Record<
  string,
  { source: string; controls: string; related: string[] }
> {
  return {
    "/reports": {
      source:
        "Stored glucose readings in the selected period feed the range summary and the typical-day preview.",
      controls:
        "Use the date range above the overview, then select a report card. Appearance sets the glucose units. Connectors & Apps manages incoming records.",
      related: ["/reports/agp", "/reports/day-in-review"],
    },
    "/reports/executive-summary": {
      source:
        "Glucose readings and treatments in the selected period are summarized into headline figures and a coverage indicator.",
      controls:
        "Select the date range above the report, or use Filters. Appearance sets the glucose units. Select a detailed report to examine a figure.",
      related: ["/reports/agp", "/reports/glucose-distribution"],
    },
    "/reports/agp": {
      source:
        "Glucose readings from all days of the period are grouped by time of day into a median and percentile bands.",
      controls:
        "Select the report period above the page. The default is 14 days. Appearance sets the glucose units.",
      related: ["/reports/day-in-review", "/reports/hourly-stats"],
    },
    "/reports/glucose-distribution": {
      source:
        "Glucose readings are counted by value interval, and grouped by hour for the hourly chart.",
      controls:
        "Select the report period above the page. Appearance sets the glucose units. Connectors & Apps manages sources and imports.",
      related: ["/reports/hourly-stats", "/reports/data-quality"],
    },
    "/reports/ehba1c": {
      source:
        "Estimates come from your stored sensor and meter readings. Lab results come from the dated entries that you save on this page.",
      controls:
        "The report shows all years with glucose data and has no date selector. Appearance sets the unit, % (NGSP) or mmol/mol (IFCC), and the name HbA1c or A1c. Add a lab result with the form below the chart.",
      related: ["/reports/year-overview", "/reports/glucose-distribution"],
    },
    "/reports/year-overview": {
      source:
        "The server builds one summary for each local day from glucose, insulin and carb records. Days and years follow your time zone. Without a time zone, the report stays empty and shows the reason.",
      controls:
        "The source filter limits the years to some data sources. Types hides record types from the day counts. The color panel sets the metric, focus window, boundaries, palette and Mirror. These controls change only the view, not your records.",
      related: ["/reports/day-in-review", "/reports/ehba1c"],
    },
    "/reports/readings": {
      source:
        "The glucose chart uses recorded samples and available treatment/device tracks in the chosen interval.",
      controls:
        "Choose dates and visible chart tracks on this page. The default is 7 days. Appearance changes units. Connectors & Apps manages the records being displayed.",
      related: ["/reports/day-in-review", "/reports/treatments"],
    },
    "/reports/day-in-review": {
      source:
        "One day's recorded glucose, treatments, and available loop and device context are aligned by timestamp.",
      controls:
        "Use the arrows to change the day. Select a treatment to edit it, if your access allows it. Use the time scrubber to see the loop state at a time.",
      related: ["/reports/treatments", "/reports/readings"],
    },
    "/reports/week-to-week": {
      source:
        "Stored glucose is grouped by weekday and by 5-minute slot of the day across the selected period.",
      controls:
        "Use the arrows to move one week back or forward. Reset returns to the current week. Appearance sets the glucose units.",
      related: ["/reports/day-in-review", "/reports/agp"],
    },
    "/reports/comparison": {
      source:
        "Each side runs the same glucose, insulin and carb analysis for its own date window.",
      controls:
        "Choose a preset or set both periods and their labels, then select Load. Swap exchanges the loaded periods immediately. Appearance sets the glucose units.",
      related: ["/reports/day-in-review", "/reports/data-quality"],
    },
    "/reports/hourly-stats": {
      source:
        "Glucose readings are grouped into local-hour buckets across the selected days. Hours follow the time zone in your settings.",
      controls:
        "Choose the date range above the report. The chart, the lists of best and worst hours and the table describe that range. Appearance sets the glucose units and the time format.",
      related: ["/reports/readings", "/reports/agp"],
    },
    "/reports/basal-analysis": {
      source:
        "Recorded basal delivery, temp basals, suspends and the therapy schedule provide the rate and its duration.",
      controls:
        "Choose the report period. The default is 14 days. Therapy shows the imported schedule. This report does not change pump settings.",
      related: ["/reports/insulin-delivery", "/settings/profile"],
    },
    "/reports/insulin-delivery": {
      source:
        "Recorded basal and bolus delivery and carb entries are summarized by day and by hour.",
      controls:
        "Choose the report period. The default is 30 days. Inspect records in Treatments and schedules in Therapy.",
      related: ["/reports/treatments", "/reports/basal-analysis"],
    },
    "/reports/site-change-impact": {
      source:
        "Recorded site, pod and cannula changes define the windows. Glucose readings around each change are compared.",
      controls:
        "Choose the report period. Check the times of site-change events in Treatments.",
      related: ["/reports/treatments", "/settings/trackers"],
    },
    "/reports/idp": {
      source:
        "Glucose statistics, recorded insulin delivery and the therapy profile provide the panels of the profile.",
      controls:
        "Choose the report period. The default is 14 days. Therapy provides the profile and scheduled basal. Connectors & Apps manages delivery records.",
      related: ["/reports/agp", "/reports/insulin-delivery"],
    },
  };
}
