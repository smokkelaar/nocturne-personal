import { guide } from "./guide.svelte";
import { reportContext } from "./report-context.svelte";
import { GLUCOSE_REFERENCE_PATH } from "./reference-path";
import type { HelpArticle } from "./documentation-types";

/**
 * Adds topic sections after the four standard ones, for reports that need more
 * than those.
 */
function withTopics(
  article: HelpArticle,
  topics: [string, string][]
): HelpArticle {
  return {
    ...article,
    sections: [
      ...article.sections,
      ...topics.map(([title, text]) => ({ title, text })),
    ],
  };
}

export function reportArticles(): HelpArticle[] {
  const context = reportContext();
  const report = (
    href: string,
    title: string,
    intro: string,
    used: string,
    detail: string,
    topics: [string, string][] = []
  ) =>
    withTopics(
      guide(
        href,
        title,
        intro,
        context[href].source,
        context[href].controls,
        used,
        detail,
        [...context[href].related, GLUCOSE_REFERENCE_PATH]
      ),
      topics
    );
  const loopPage = (
    href: string,
    title: string,
    intro: string,
    source: string,
    controls: string,
    used: string,
    limits: string,
    topics: [string, string][],
    related: string[]
  ) =>
    withTopics(
      guide(href, title, intro, source, controls, used, limits, [
        ...related,
        GLUCOSE_REFERENCE_PATH,
      ]),
      topics
    );
  return [
    report(
      "/reports",
      "Reports overview",
      "The overview shows the main glucose figures for a period and leads to the detailed reports.",
      "Select a report card to open that report. Most reports start with the period that you chose here.",
      "A report card appears only when your access includes the data that the report needs. Opening a report does not start an import. Days of data are counted on UTC days."
    ),
    report(
      "/reports/executive-summary",
      "Executive summary",
      "One page with the main glucose figures, the data coverage and a short breakdown of each day.",
      "Start here. Then open AGP for the usual day, or Day in review for one actual day.",
      "The figures describe the readings in the period. They do not show why a figure changed. With low CGM coverage, the figures describe only part of the period.",
      [
        [
          "How complete is your CGM data",
          "CGM active time is the part of the period with sensor readings. The consensus advice is at least 70% active time over 14 days. Below that, the figures are less reliable.",
        ],
        [
          "The figures",
          "Time in range, average, median, standard deviation and coefficient of variation (CV) use all readings in the period. The percentiles show the spread. MAGE is the mean size of the large glucose swings.",
        ],
      ]
    ),
    report(
      "/reports/agp",
      "Glucose profile (AGP)",
      "The Ambulatory Glucose Profile puts all days of the period on one 24-hour axis. It shows your usual day.",
      "The dark line is the median. The darker band holds the middle 50% of the readings at that time, and the lighter band the middle 80%.",
      "The profile is not the trace of one actual day. A time with few readings gives an unreliable band. The consensus advice is at least 14 days of data with 70% sensor wear.",
      [
        [
          "Time in ranges",
          "The bar next to the profile shows the share of time in each glucose range. The consensus target is at least 70% in range, less than 4% below range and less than 1% very low.",
        ],
      ]
    ),
    report(
      "/reports/glucose-distribution",
      "Glucose distribution",
      "See how often readings fall in each range, how they spread, and how this changes by hour.",
      "The histogram counts readings by glucose value. The statistics describe the spread, and the hourly chart shows the distribution for each hour of the day.",
      "The histogram counts readings, not time. A gap in the readings is not counted. Estimated A1c on this page comes from glucose, not from a blood test.",
      [
        [
          "Variability figures",
          "GVI (glycemic variability index) compares the length of the glucose line with a flat line. PGS (patient glycemic status) combines GVI, the mean glucose and the time in range. Lower values mean more stable glucose.",
        ],
      ]
    ),
    report(
      "/reports/ehba1c",
      "Estimated HbA1c (eHbA1c)",
      "This report estimates the HbA1c that a lab test would show on each day. It uses your glucose readings. You can add lab results to compare.",
      "The summary shows the latest estimate, its weighted mean glucose, and the highest and lowest estimate. Lab results show as triangles on the chart.",
      "A day gets an estimate only when its 90-day window holds at least 30 readings. A short history or a long gap leaves days without a point. The report does not estimate future days.",
      [
        [
          "How the estimate is calculated",
          "For each day, the report takes all sensor and meter readings from the previous 90 days. Recent days count more: the last 30 days give half of the weight. The weighted mean glucose then goes through the ADAG formula: eHbA1c (%) = (mean glucose in mg/dL + 46.7) / 28.7.",
        ],
        [
          "The colored zones",
          "The zones are: non-diabetic range up to 5.7%, type 1 diabetes target up to 7%, elevated up to 9%, and very high above 9%. In mmol/mol, the same limits are converted.",
        ],
        [
          "Lab results",
          "Enter the date of the blood draw, not the date that you add it. The value must be between 3.0% and 20.0%, or the same in mmol/mol. The date cannot be in the future. A note can have 500 characters.",
        ],
        [
          "When estimate and lab value differ",
          "Lab results never change the estimate. A lab value also depends on things that glucose readings do not show, for example the life span of red blood cells. Discuss a large difference with your care team.",
        ],
      ]
    ),
    report(
      "/reports/year-overview",
      "Year overview",
      "A calendar heatmap shows one cell for each day of every year with data. Use it to find periods to examine in more detail.",
      "Select a day to open it in Day in review. Select a month name to open the calendar, or a week label to open Week to week. Below each year, a chart shows the glycemic risk index (GRI) for each month.",
      "An empty cell has no records. A gray cell has records, but no value for the selected metric. Do not read either one as a good day. A day with missing uploads shows totals that are too low.",
      [
        [
          "How the metrics are calculated",
          "Avg glucose is the mean of the sensor and meter readings of the day. Time in range uses the consensus range of 70 to 180 mg/dL (3.9 to 10.0 mmol/L), not your own thresholds. Bolus adds manual and automatic boluses. Basal multiplies the rate of each recorded temp basal by its duration. TDD is bolus plus basal. Carbs adds the carb entries.",
        ],
        [
          "Basal and missing records",
          "Basal counts only recorded temp basals. A temp basal without an end time counts as 5 minutes. All of its insulin counts on the day that it started. Scheduled basal from the profile is not added.",
        ],
        [
          "Colors and the focus window",
          "Glucose colors are fixed to glucose values, so a color always means the same glucose. Time in range runs from 0 to 100%. The other metrics run from 0 to the highest day in the loaded years. Move the two focus handles to narrow the colored range. Days outside it fade by the Dim outside percentage.",
        ],
        [
          "Palettes, boundaries and Mirror",
          "A palette replaces the theme colors of the selected metric. Mirror reverses the order of the colors. A color boundary pins a color to a value. You can change the color at each boundary and at each end. Swap colors exchanges the two end colors, except for glucose.",
        ],
        [
          "Saving and resetting colors",
          "Each metric keeps its own color settings. They are saved with your display preferences. A new palette removes the end colors that you set for the previous one. Reset removes all color settings of the selected metric.",
        ],
        [
          "Loading and printing",
          "The newest year loads first. Older years load when you scroll to them. If a year does not load, select Retry. Print loads all years first. On paper, glucose uses one color ramp and hatching marks low and high days.",
        ],
      ]
    ),
    report(
      "/reports/readings",
      "Day-by-day view",
      "Explore the recorded glucose trace and its treatment context.",
      "These readings also feed the dashboard, calendar, and glucose statistics.",
      "Use the chart's date and display controls. Points are samples. A connecting line is not an extra measurement."
    ),
    report(
      "/reports/day-in-review",
      "Day in review",
      "Bring the glucose, treatments and loop activity of one day together on a timeline.",
      "Inspect the timing behind a pattern or an unusual reading. Other reports, such as Year overview and Loop analysis, open a day here.",
      "Events appear only when they are recorded and imported. An event near a change in glucose does not prove that it caused the change."
    ),
    report(
      "/reports/week-to-week",
      "Week to week",
      "Compare the days of the week on one 24-hour axis.",
      "Each line is one weekday. With a range of seven days, each line is one actual day. With a longer range, each line is the mean of that weekday.",
      "The same weekday can have unequal coverage between weeks. A mean can hide short highs and lows."
    ),
    report(
      "/reports/comparison",
      "Comparison",
      "Compare two periods with the same glucose, insulin and carb figures.",
      "Find the figures that changed, then examine individual days of each period.",
      "Different devices, coverage or durations can change the result. A difference does not prove a treatment effect."
    ),
    report(
      "/reports/hourly-stats",
      "Hourly patterns",
      "This report puts every day of the range on one 24-hour clock. It shows which hours tend to go well and which are harder.",
      "Each bar is one hour of the day. Its bands show the share of that hour's readings in each range, lowest at the bottom. The table shows the same figures with the typical glucose of each hour.",
      "An hour is compared with the others only when it has readings on enough days. Best and worst hours are named only when they differ enough. Tight range is part of in range, so do not add their percentages."
    ),
    report(
      "/reports/basal-analysis",
      "Basal rate analysis",
      "Inspect the basal rate that your pump delivered at each hour of the day.",
      "The median line and the shaded bands show the delivered rate by hour across the days. Wider bands mean the rate varied more at that hour.",
      "Therapy profiles provide the scheduled rates. Temp basal and suspend records describe the changes. Missing delivery records or profiles limit the analysis."
    ),
    report(
      "/reports/insulin-delivery",
      "Insulin delivery",
      "Review basal and bolus totals, their split and their timing.",
      "Daily totals show the split between basal and bolus against your carbs. The hourly chart shows the mean delivery for each hour, split into basal, manual bolus and automatic bolus.",
      "Bolus amounts and basal rates have different units. Basal totals depend on the duration of the records. Incomplete imports make totals too low."
    ),
    report(
      "/reports/site-change-impact",
      "Site change impact",
      "Compare glucose in the 12 hours before and the 24 hours after each infusion site change.",
      "The line is the median glucose across all site changes. The bands show the 25th to 75th and the 10th to 90th percentiles. The summary compares time in range before and after.",
      "The report needs at least two site changes with glucose around them. A site, pod or cannula change counts. The figures are averages, not the result of one change. They do not prove that the change caused a difference."
    ),
    report(
      "/reports/idp",
      "Insulin dosing profile (IDP)",
      "A standard summary of insulin delivery and glucose for the selected period.",
      "The panels show the basal and bolus split, the glucose figures, the glycemic risk index and a daily glucose pattern with basal and bolus distribution.",
      "Scheduled basal comes from the therapy profile. It is not proof of delivered insulin. Missing profiles or treatments leave panels empty. This report is only available to members, not on a public share."
    ),
    loopPage(
      "/reports/loop-analysis",
      "Loop analysis",
      "Five pages show what your automated insulin delivery did: Daily profile, Meals and events, Prediction accuracy, Loop health and Settings evidence.",
      "Glucose, treatment, device-status, prediction and therapy-profile records provide the data. The results depend on what your loop uploads.",
      "Select Filters (the funnel icon) to choose dates, a profile, days of the week and time to exclude. All five pages use the same filters. Select a page name to change page.",
      "Compare timing and coverage across the pages. Then open individual days or events in Day in review.",
      "Missing uploads and short history limit the results. The pages describe observations. They do not prove a treatment effect or recommend changes to your settings.",
      [
        [
          "Excluded time",
          "Accepted compression lows and other data exclusions are always removed from glucose. You can also exclude overrides, temporary targets, exercise, illness and time not in closed loop.",
        ],
        [
          "Compare with another range",
          "Compare with adds a second range to the charts. When your access shows only recent history, the pages use only that window and cannot compare ranges.",
        ],
      ],
      ["/reports/day-in-review", "/reports/insulin-delivery"]
    ),
    loopPage(
      "/reports/loop-analysis/daily-profile",
      "Loop analysis: Daily profile",
      "This page shows glucose, basal, loop corrections, insulin on board (IOB) and carbs on board (COB) at each time of day.",
      "Glucose readings, basal and bolus records, temp basals, and the IOB and COB that your loop uploads.",
      "Use Filters for the range. Use the switches below the correction chart to show manual temp basals, suspends and inferred delivery. Select a time on a chart to list the days at that time.",
      "The totals show the mean insulin for one day: basal, automatic boluses, manual boluses and the net loop correction. A link opens Insulin delivery for the same range.",
      "Each time of day uses data from one day at most. Faded areas have too few days to show a pattern. IOB and COB are estimates from your loop.",
      [
        [
          "Net loop correction",
          "This chart shows the insulin that the loop added to your scheduled basal or removed from it. It includes temp basals and automatic boluses.",
        ],
        [
          "Median and bands",
          "Each chart shows all days of the range on one 24-hour axis. The line is the median. The bands show the 25% to 75% and 10% to 90% spread of the days.",
        ],
      ],
      ["/reports/loop-analysis", "/reports/insulin-delivery"]
    ),
    loopPage(
      "/reports/loop-analysis/meals-and-events",
      "Loop analysis: Meals and events",
      "This page aligns your glucose and insulin on meals, corrections and other events. It shows the time before and after each event.",
      "Carb entries, boluses, sensor starts, exercise, overrides and temporary targets. Unannounced rises are found in the glucose readings.",
      "Choose the event type of each cohort, a time of day and a carb amount. You can compare a maximum of three cohorts. Set the window before and after the event.",
      "The charts align the events of each cohort at 0. The table shows the median results after the events. The list shows each event, and you can open it in Day in review.",
      "Isolated events only removes each event that has another meal, correction bolus or unannounced rise in its window. Few events give unstable medians.",
      [
        [
          "The results",
          "Results include the peak rise, the time to the peak and the glucose at 2 and 4 hours. They also include the lowest glucose and the insulin above schedule.",
        ],
        [
          "Only rises with extra loop insulin",
          "For unannounced rises, this option keeps only the rises where the loop delivered more insulin than scheduled.",
        ],
      ],
      ["/reports/loop-analysis", "/reports/day-in-review"]
    ),
    loopPage(
      "/reports/loop-analysis/prediction-accuracy",
      "Loop analysis: Prediction accuracy",
      "This page compares the glucose predictions of the loop with the readings that followed them.",
      "The prediction curves that your loop uploads in its device status, and the glucose readings after each prediction.",
      "Use Filters for the range. If there is more than one curve, select a curve at the top of By hour and context.",
      "Each chart shows the error at each horizon. Bias is the prediction minus the reading. A positive bias means the predictions were too high. MAE is the mean size of the error.",
      "Only the bias at the horizon marked Settings signal gives information about your settings. Longer horizons include actions of the loop that the prediction did not expect.",
      [
        [
          "Bias by hour and by context",
          "The heatmap shows the bias for each hour of the day and each horizon. The context table groups predictions by the events in the three hours before them, for example a meal.",
        ],
        [
          "When the page is hidden",
          "Predictions come from device data. When your access does not include device data, the page shows no figures.",
        ],
      ],
      ["/reports/loop-analysis", "/reports/loop-analysis/settings-evidence"]
    ),
    loopPage(
      "/reports/loop-analysis/loop-health",
      "Loop analysis: Loop health",
      "This page shows how much of the time the loop was closed, why it stopped and how frequently it reached its limits.",
      "Device-status records of your loop, pump and CGM, temp basals and the maximum basal of your settings.",
      "Use Filters for the range. Select an hour on a chart to show only the gaps that started in that hour. Select a gap to open it in Day in review.",
      "The tiles show the share of time with a closed loop and an active CGM and pump. The hourly charts show zero temps, time at maximum basal and the sensitivity ratio.",
      "When the data cannot give a figure, the tile shows Unknown and the reason. Each hour uses data from one day at most. Hours with too few days do not show a pattern.",
      [
        [
          "Gaps",
          "The list shows each gap in the loop, longest first, with its cause when it is known.",
        ],
      ],
      ["/reports/loop-analysis", "/reports/day-in-review"]
    ),
    loopPage(
      "/reports/loop-analysis/settings-evidence",
      "Loop analysis: Settings evidence",
      "This page compares your basal, insulin sensitivity (ISF) and carb ratio settings with observations from your data.",
      "Your therapy profile, and fasting periods, correction boluses and meals with carb entries from your data.",
      "Use Filters for the range. Select a row to see the days or events behind that figure.",
      "The chart shows the profile setting as a line and the observed value of each block as a dot. Each row shows the observed value, the profile value, the number of episodes and the confidence.",
      "The figures are observations, not advice. Speak to your diabetes care team before you change a setting. A block with too few episodes shows no figure.",
      [
        [
          "Confidence",
          "Each figure has high, moderate or low confidence. Select a row to read why the confidence is not higher and which candidates the report did not use.",
        ],
      ],
      ["/reports/loop-analysis", "/settings/profile"]
    ),
    guide(
      "/reports/data-quality",
      "Data quality",
      "Check whether your recorded glucose is complete and reliable.",
      "Stored glucose readings, compression-low suggestions, paired readings from two devices and records that an uploader sent but Nocturne could not store.",
      "Open a quality report from the list. Run detection scans a date range for compression lows. Settings > Data quality controls automatic detection and your typical sleep times.",
      "The counts show how many compression lows are pending, accepted or dismissed. Review the pending ones in Compression lows.",
      "A flag is a reason to inspect, not proof that a reading is wrong. Rejected uploads show only to owners and members who can change tenant settings.",
      [
        "/settings/data-quality",
        "/reports/data-quality/sensor-integrity",
        "/reports/data-quality/cgm-comparison",
        "/reports/data-quality/compression-lows",
        "/reports/data-quality/rejected-uploads",
      ]
    ),
    guide(
      "/reports/data-quality/sensor-integrity",
      "Signal integrity",
      "Find windows where the readings rise and fall in a way that is unlikely to be real glucose.",
      "The report examines the stored glucose readings for rapid changes of direction. It needs no extra information from the uploader.",
      "Choose the date range with the report filters. Select a day in the overview to expand it. Select a row in Flagged windows to show its day.",
      "The daily overview places the flagged windows in time. The low-glucose list shows lows within 3 hours after a flagged window, and insulin dosed during it.",
      "The detection runs after the fact. A low after a flagged window does not prove that the sensor caused it. A flag does not change your data.",
      ["/reports/data-quality", "/reports/data-quality/compression-lows"]
    ),
    guide(
      "/reports/data-quality/cgm-comparison",
      "CGM comparison",
      "Compare devices that recorded glucose near the same time.",
      "Readings paired between your selected device and reference.",
      "Choose Device, Reference, and Match within here. Manage sources in Settings > Connectors & Apps.",
      "The scatter and agreement summaries show differences between paired readings. MARD is the mean absolute relative difference.",
      "Unpaired readings are excluded. A wider tolerance allows paired readings farther apart in time. Your chosen reference is not guaranteed ground truth.",
      ["/settings/connectors", "/reports/data-quality"]
    ),
    guide(
      "/reports/data-quality/compression-lows",
      "Compression lows",
      "Review suggested lows during sleep that can come from pressure on the sensor.",
      "Automatic detection examines the stored glucose of each night with the detection settings. You can also run detection from the Data quality report.",
      "Set the date and status filters here. Select a suggestion to see its glucose. Settings > Data quality controls automatic detection and your typical sleep times.",
      "Accept marks the window as a false low. Loop analysis then removes it from glucose. Other reports and statistics still include these readings.",
      "A suggestion can be wrong and does not prove that pressure caused a low. Dismiss a real low. Accept and dismiss need write access to glucose data.",
      ["/settings/data-quality", "/reports/data-quality"]
    ),
    guide(
      "/reports/data-quality/rejected-uploads",
      "Rejected uploads",
      "See records that an uploader sent, but that Nocturne could not store.",
      "Nocturne keeps each record that it answered but could not store, because a value in it could not be stored as sent.",
      "Use Newer and Older to move between pages of 25. Export this page saves the records as a JSON file. Clear this page removes only the records on this page.",
      "Most uploaders treat these records as saved. Use the list to find the uploader, the reason and the record, and correct the cause at the source.",
      "These records are not in your data. A cleared record cannot be recovered, so export it first. Only owners and members who can change tenant settings can open this page.",
      ["/reports/data-quality", "/settings/connectors"]
    ),
    guide(
      "/reports/steps",
      "Steps",
      "This guide covers Steps: counting steps and viewing your activity over time.",
      "Step-count records received from a supported source. Google Health can import steps available in your connected account.",
      "Choose dates above the report. Settings > Connectors & Apps > Google Health controls step imports and the historical start date.",
      "Daily totals and activity timing help you explore your routine alongside glucose.",
      "An empty day does not necessarily mean no steps. Check source data, import selection, progress, and dates. Overlapping source records can differ from your watch's total.",
      ["/settings/connectors/google-health", "/settings/connectors"]
    ),
    guide(
      "/reports/heart-rate",
      "Heart Rate",
      "This guide covers Heart Rate: your recorded heart rate and patterns over time.",
      "Device or service samples through a supported connector. Google Health reduces its samples to one stable average per minute.",
      "Choose dates here. Enable heart rate in Settings > Connectors & Apps > Google Health after checking your device's readings reach that account.",
      "The timeline and daily summaries show heart-rate patterns alongside glucose. The resting estimate is the 10th percentile of the readings in the range.",
      "Values are beats per minute. Sampling and averaging can hide brief changes. Missing readings are not a zero heart rate. This page defines no universal high or low threshold.",
      ["/settings/connectors/google-health", "/settings/connectors"]
    ),
    guide(
      "/reports/sleep",
      "Sleep",
      "Explore sleep sessions, timing, and stage composition.",
      "Imported sleep sessions and stages, including supported Google Health records.",
      "Choose dates and a source here. Open a night for details. Configure imports in Connectors & Apps > Google Health.",
      "Compare nights and glucose during recorded sleep windows.",
      "Device stages are estimates. Missing stages stay missing. Google filters sessions by their end time, so a night can begin before the import start date.",
      ["/settings/connectors/google-health", "/reports/heart-rate"]
    ),
    guide(
      "/reports/treatments",
      "Treatments",
      "Browse, search, add, or edit diabetes events.",
      "Uploaded, imported, and manually saved insulin, carb, notes, and device events.",
      "Use category tabs and Search here. Add/edit and bulk deletion require write permission. Settings > Therapy shows schedules. Connectors & Apps manages sources.",
      "Events appear on glucose timelines and feed insulin and carb analysis.",
      "Event time, units, and type matter. Deletion changes later analysis. A source can recreate records on import unless the applicable deletion protection prevents it.",
      ["/settings/profile", "/settings/connectors", "/reports/insulin-delivery"]
    ),
    guide(
      "/reports/battery",
      "Battery",
      "Review battery information uploaded by devices.",
      "Device-status records containing battery values.",
      "Choose dates here. Configure devices and uploaders in Connectors & Apps.",
      "Battery history helps identify devices needing charging or missing uploads.",
      "Devices use different formats and update intervals. Missing battery information means unknown, not empty.",
      ["/settings/connectors"]
    ),
    guide(
      "/reports/sleep/[date]",
      "Sleep night",
      "Inspect one night and its stages.",
      "The selected sleep session, stage records, and glucose during that window.",
      "Open a night from the Sleep report. Choose other dates there. Import settings are in Connectors & Apps > Google Health.",
      "The hypnogram and glucose summary explain the overview in detail.",
      "Missing stages and glucose stay missing. Overlapping sessions and estimated stage labels can limit the summary.",
      ["/reports/sleep", "/settings/connectors/google-health"]
    ),
  ];
}
