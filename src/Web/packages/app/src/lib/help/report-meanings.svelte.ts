import type { HelpSection } from "./documentation-types";

const item = (title: string, text: string): HelpSection => ({ title, text });

/**
 * The open "What you see and what it means" block of each report, keyed by
 * href. Steps, Heart rate and Sleep are in {@link pageMeanings}.
 */
export function reportMeanings(): Record<string, HelpSection[]> {
  const ranges = item(
    "Glucose ranges",
    "Very low is below 3.0 mmol/L (54 mg/dL). Low is 3.0 to 3.8 mmol/L (54 to 69 mg/dL). In range is 3.9 to 10.0 mmol/L (70 to 180 mg/dL). High is 10.1 to 13.9 mmol/L (181 to 250 mg/dL). Very high is above 13.9 mmol/L (250 mg/dL). Reports always use these consensus ranges, not your personal targets."
  );
  const coverage = item(
    "Days of data badge",
    "The badge counts the days with readings. Below the recommended number, which is 14 days or the length of a shorter period, the figures describe only part of your usual pattern."
  );
  return {
    "/reports": [
      item(
        "Time in range",
        "The share of your readings between 70 and 180 mg/dL. The consensus target is at least 70%. Each extra 5% in range is about one more hour in range each day."
      ),
      item(
        "Average glucose and CV",
        "Average glucose is the mean of all readings. The coefficient of variation (CV) is the spread as a percentage of that mean. A CV of 36% or lower means stable glucose."
      ),
      item(
        "Time below range",
        "The share of readings under 70 mg/dL. The consensus target is less than 4%, and less than 1% under 54 mg/dL. Look at this figure first, because lows are the most urgent risk."
      ),
      item(
        "Typical day",
        "A small preview of the glucose profile. The line is the middle value at each time of day. Open the AGP report for the full chart."
      ),
    ],
    "/reports/executive-summary": [
      coverage,
      item(
        "Target met or not met",
        "Each card compares one figure with the international consensus target and says Target met or Target not met. The targets are general. Your care team sets your personal targets."
      ),
      ranges,
      item(
        "Time breakdown per day",
        "The percentages are also shown as hours and minutes on an average day. For example, 4% below range is about 1 hour each day."
      ),
      item(
        "Estimated A1c (GMI)",
        "The glucose management indicator estimates a lab HbA1c from your mean glucose. GMI (%) = 3.31 + 0.02392 x mean glucose in mg/dL. The general target is below 7%."
      ),
      item(
        "Glucose stability",
        "CV at or below 36% means stable glucose. Above 36% means large swings and a higher risk of lows. Standard deviation and MAGE show the size of the swings in glucose units."
      ),
      item(
        "CGM active time",
        "The share of the period with sensor readings. Aim for at least 70% over 14 days. The figures on the page are most reliable at 90% or higher."
      ),
      item(
        "What your data is telling us",
        "Short notes that the report makes from your figures. They describe the data. They are not medical advice."
      ),
    ],
    "/reports/agp": [
      coverage,
      item(
        "The dark line",
        "Your median glucose at each time of day: on half of the days glucose was lower, on half higher. It shows what happens most often."
      ),
      item(
        "The dark band",
        "The 25th to 75th percentile. On half of the days, glucose at that time was inside this band. A narrow band means a predictable time of day."
      ),
      item(
        "The light band",
        "The 10th to 90th percentile. It holds 80% of the readings at that time. Its edges show the lows and highs that happen regularly, not the extremes."
      ),
      item(
        "The shaded target zone",
        "The consensus target range of 70 to 180 mg/dL. Times where the bands cross its lower edge show when lows occur. Times above its upper edge show when highs occur."
      ),
      ranges,
      item(
        "How to use it",
        "Find the time of day with the widest band or the lowest dip. Then open Day in review for days in this period to find the cause."
      ),
    ],
    "/reports/glucose-distribution": [
      coverage,
      item(
        "The ring chart",
        "Each slice is the share of readings in one glucose range. Tight range, 70 to 140 mg/dL, is part of in range. Show tight range adds it as its own slice."
      ),
      ranges,
      item(
        "Estimated A1c",
        "Based on average glucose. It uses the GMI formula, 3.31 + 0.02392 x mean glucose in mg/dL. It is an estimate, not a blood test."
      ),
      item(
        "GVI",
        "The glycemic variability index compares the length of your glucose line with a flat line. 1.0 to 1.2 is low variability, 1.2 to 1.5 is moderate, above 1.5 is high."
      ),
      item(
        "PGS",
        "Patient glycemic status combines GVI, mean glucose and time in range. 35 or less is excellent, 35 to 100 is good, 100 to 150 is poor, above 150 is very poor."
      ),
      item(
        "Daily glucose changes",
        "Mean total daily change adds up how far glucose moved up and down on an average day. Time in fluctuation is the share of readings that changed more than 15 mg/dL in about 5 minutes."
      ),
      item(
        "Hourly distribution",
        "One stacked bar for each hour of the day. Hours with a large share below range are the times when lows occur. Hours with a large share above range are the times of highs."
      ),
    ],
    "/reports/ehba1c": [
      item(
        "The line",
        "Each point is the estimate for one day, from the readings of the 90 days before it. The line moves slowly, because each day shares most of its window with the day before."
      ),
      item(
        "The colored zones",
        "Up to 5.7% is the non-diabetic range. Up to 7% is the usual target for type 1 diabetes. Up to 9% is elevated. Above 9% is very high."
      ),
      item(
        "Triangles",
        "Lab results that you entered, placed on the day of the blood draw. Compare the triangle with the line on that day."
      ),
      item(
        "Estimate and lab differ",
        "A difference of up to about 0.5% is common. A larger, constant difference can come from your red blood cells or from sensor accuracy. Discuss it with your care team."
      ),
      item(
        "Units",
        "Appearance sets % (NGSP) or mmol/mol (IFCC). 7% is 53 mmol/mol, and 9% is 75 mmol/mol."
      ),
    ],
    "/reports/year-overview": [
      item(
        "One cell is one day",
        "Each cell is one day of the year. Its color shows the value of the selected metric on that day. The color scale shows which color belongs to which value."
      ),
      item(
        "Glucose colors",
        "With Avg glucose, a color always belongs to the same glucose value, so you can compare years. A good mean can hide lows and highs. Use Time in range to see how much of each day was in range."
      ),
      item(
        "Empty and gray cells",
        "An empty cell has no records at all. A gray cell has records, but no value for this metric, for example no carbs. Neither one means a good day."
      ),
      item(
        "Dimmed days",
        "When you narrow the focus window, days outside it fade. The bright days are the days that match the values that you are looking for."
      ),
      item(
        "Monthly GRI chart",
        "The glycemic risk index for each month, from 0 to 100. Zone A (0 to 20) is the lowest risk, zone E (above 80) the highest. Lows weigh more than highs."
      ),
    ],
    "/reports/readings": [
      item(
        "Glucose dots and line",
        "Each dot is one stored reading. The color shows its range, from the thresholds in your therapy settings. A line between dots is not an extra reading."
      ),
      item(
        "Markers",
        "Markers on the chart show boluses, carbs, finger-stick checks and device events at the time they were recorded."
      ),
      item(
        "Tracks",
        "The tracks under the chart show basal delivery, insulin on board (IOB) and carbs on board (COB), when your uploader sends them."
      ),
      item(
        "Gaps",
        "A gap in the dots means no readings were stored for that time. It is not a level of glucose."
      ),
    ],
    "/reports/day-in-review": [
      item(
        "Day figures",
        "Mean, median, standard deviation, range and GMI describe the readings of this one day. One day is too short for an estimated A1c, so read GMI here as an indication."
      ),
      item(
        "The chart",
        "Glucose with the events of the day: boluses, carbs, basal, and the loop state when your loop uploads it. Move the time scrubber to see the values at one time."
      ),
      item(
        "Totals",
        "Total carbs, manual boluses and automatic boluses add up the records of the day. Missing uploads make them too low."
      ),
      item(
        "Treatments timeline",
        "Every recorded event of the day in time order. Select an event to edit it, if you have write access."
      ),
    ],
    "/reports/week-to-week": [
      item(
        "One line for each weekday",
        "Each weekday has its own color. Over the default 7 days, each line is one actual day. Over a longer range, each line is the mean of all days with that weekday."
      ),
      item(
        "What to look for",
        "Lines that run apart at the same time show a weekday with a different routine, for example a sports day or the weekend."
      ),
      item(
        "No line",
        "A weekday without readings has no line. A short line means readings only for part of that day."
      ),
    ],
    "/reports/comparison": [
      item(
        "Change column",
        "Each row shows a figure for both periods and the difference. Lower in and Higher in name the period with the lower or higher value."
      ),
      item(
        "Better or worse",
        "For time in range, more is better. For time below range, CV, GRI and very high time, less is better. Read the direction for each figure."
      ),
      item(
        "Stacked bars",
        "One bar for each period with the full range breakdown. Compare the parts below range at the bottom first, because they show lows."
      ),
      item(
        "Data quality rows",
        "CGM active time, days with data and readings per day show whether the two periods are comparable. A large difference makes the other rows less reliable."
      ),
    ],
    "/reports/hourly-stats": [
      item(
        "Bars",
        "One bar for each hour from midnight. Each band is the share of that hour's readings in one range, lowest range at the bottom."
      ),
      ranges,
      item(
        "At a glance",
        "Lists the hours with the most time in range, the most time below range and the most time above range. Start with the hours below range."
      ),
      item(
        "Which hours are compared",
        "An hour is compared only when it has readings on at least 5 days and 20 readings in all. Best and worst hours need a difference of at least 5 percentage points."
      ),
      item(
        "Middle half",
        "In the table, the range in which the central 50% of that hour's readings fell. A wide middle half means that hour changes much from day to day."
      ),
    ],
    "/reports/basal-analysis": [
      item(
        "Median line",
        "The basal rate that was delivered most often at each hour, in units per hour. It includes the changes that your loop or you made."
      ),
      item(
        "Shaded bands",
        "The 10th to 90th percentile of the delivered rate. A wide band at an hour means your loop changes the basal often at that time."
      ),
      item(
        "Average hourly basal",
        "The mean insulin delivered in each hour of the day. Compare it with the scheduled rate in Therapy. A large difference at the same hour every day is a pattern."
      ),
      item(
        "Temp basals and suspends",
        "Many temp basals or zero temps per day mean that the loop corrects your schedule often. Discuss a repeated pattern with your care team."
      ),
    ],
    "/reports/insulin-delivery": [
      coverage,
      item(
        "Total daily dose (TDD)",
        "Basal plus bolus insulin for one day. For type 1 diabetes it is usually 0.4 to 1.0 units for each kg of body weight."
      ),
      item(
        "Basal and bolus split",
        "A split of about 50% basal and 50% bolus is common. It changes with food, activity and the loop. With a loop, automatic boluses count as bolus."
      ),
      item(
        "Daily bars",
        "One bar for each day, split into basal and bolus, with the carbs that you logged. Carbs without a bolus show as a note."
      ),
      item(
        "Hourly delivery",
        "The mean insulin for each hour, split into basal, manual bolus and automatic bolus. Peaks show when you usually eat or correct."
      ),
      item(
        "Meal and correction boluses",
        "A manual bolus paired with a carb entry counts as a meal bolus. A manual bolus without carbs counts as a correction. Many corrections can point to a ratio or basal to discuss."
      ),
    ],
    "/reports/site-change-impact": [
      item(
        "Time 0",
        "The moment of each site, pod or cannula change. The chart shows 12 hours before and 24 hours after it."
      ),
      item(
        "Line and bands",
        "The line is the median glucose of all changes at that time. The bands hold the middle 50% and 80%. A rise after time 0 shows a slow start of the new site."
      ),
      item(
        "Before and after",
        "The summary compares time in range before and after the change. Higher glucose in the last hours before a change can point to a site that works less well."
      ),
    ],
    "/reports/idp": [
      item(
        "Insulin summary",
        "Basal and bolus per day with their share of the total. Delivered basal is what your pump recorded. Scheduled basal comes from your therapy profile."
      ),
      item(
        "Delivered and scheduled basal",
        "When delivered basal is much lower than scheduled, the loop often reduced it. When it is higher, the loop often added insulin."
      ),
      item(
        "Glucose metrics and GRI",
        "Time in range and the glycemic risk index. GRI runs from 0 to 100. Zone A (0 to 20) is the lowest risk, zone E (above 80) the highest. Lows weigh more than highs."
      ),
      item(
        "Glucose pattern",
        "The glucose profile of a day, with the scheduled basal rate and the times of your boluses below it."
      ),
    ],
    "/reports/loop-analysis": [
      item(
        "Five pages",
        "Daily profile shows the usual day. Meals and events shows what happens after events. Prediction accuracy checks the loop's predictions. Loop health shows how much the loop ran. Settings evidence compares your settings with the data."
      ),
      item(
        "Medians and bands",
        "Most charts put all days on one 24-hour axis. The line is the median and the bands hold the middle 50% and 80% of the days."
      ),
      item(
        "Faded areas",
        "A faded time has too few days to show a pattern. Choose a longer range in Filters."
      ),
    ],
    "/reports/loop-analysis/daily-profile": [
      item(
        "Glucose",
        "The usual glucose at each time of day, as on the AGP report."
      ),
      item(
        "Net loop correction",
        "Above zero, the loop gave more insulin than your schedule. Below zero, it gave less. A correction in the same direction at the same time every day is a pattern to discuss."
      ),
      item(
        "IOB and COB",
        "Insulin on board and carbs on board as your loop calculated them. A high IOB before a low shows insulin that was still active."
      ),
      item(
        "Totals",
        "The mean insulin of one day, split into basal, automatic boluses and manual boluses, with the net loop correction."
      ),
    ],
    "/reports/loop-analysis/meals-and-events": [
      item(
        "Time 0",
        "All events of a cohort are placed at time 0. The charts show glucose and insulin before and after them."
      ),
      item(
        "Peak rise and time to peak",
        "How far glucose rose after the event and how long it took. A late peak after meals can point to slow digestion or late bolus timing."
      ),
      item(
        "Glucose at 2 and 4 hours",
        "Glucose 2 and 4 hours after the event. A value well above the start at 4 hours shows that the insulin did not cover the event."
      ),
      item(
        "Lowest glucose",
        "The lowest reading in the window after the event. A low here can point to too much insulin for that event."
      ),
    ],
    "/reports/loop-analysis/prediction-accuracy": [
      item(
        "Bias",
        "The prediction minus the reading that followed. Above zero means the loop expected higher glucose than happened. Below zero means it expected lower glucose."
      ),
      item(
        "MAE",
        "The mean absolute error: how far off the predictions were on average, up or down. Smaller is better."
      ),
      item(
        "Horizons",
        "The time between the prediction and the reading. Errors grow with the horizon. Only the horizon marked Settings signal says something about your settings."
      ),
      item(
        "Heatmap",
        "Bias for each hour of the day. A color that repeats at the same hour shows a time when your settings and your body do not agree."
      ),
    ],
    "/reports/loop-analysis/loop-health": [
      item(
        "Closed loop time",
        "The share of time in which the loop was able to change insulin. Low closed loop time makes the other loop pages less useful."
      ),
      item(
        "CGM and pump active",
        "The share of time with recent data from the sensor and the pump. Gaps here are the most common reason for an open loop."
      ),
      item(
        "Zero temps and maximum basal",
        "Many zero temps show that the loop often stopped basal to prevent lows. Much time at maximum basal shows that it wanted more insulin than allowed."
      ),
      item(
        "Unknown",
        "A tile shows Unknown when your data cannot give that figure. The reason is shown on the tile."
      ),
    ],
    "/reports/loop-analysis/settings-evidence": [
      item(
        "Line and dots",
        "The line is the value in your profile. Each dot is the value that your data showed for that time block."
      ),
      item(
        "Dot above or below the line",
        "A dot far from the line means your data behaves differently from the setting. A row shows how many episodes support the figure."
      ),
      item(
        "Confidence",
        "High, moderate or low. Low confidence means few or uneven episodes. Use only high-confidence rows as a topic for your care team."
      ),
    ],
    "/reports/data-quality": [
      item(
        "Compression lows by status",
        "Pending suggestions need your review. Accepted ones are marked as false lows. Dismissed ones are real lows."
      ),
      item(
        "Categories",
        "Signal integrity finds unlikely jumps in the readings. CGM comparison compares two sensors. Rejected uploads lists records that Nocturne did not store."
      ),
      item(
        "Review now",
        "Opens the pending compression lows. Accepted lows stay in most reports. Only Loop analysis removes them."
      ),
    ],
    "/reports/data-quality/sensor-integrity": [
      item(
        "Flagged windows",
        "Times where the readings changed direction fast and often. Real glucose rarely does this. A flagged window often comes from a loose or new sensor."
      ),
      item(
        "Daily overview",
        "Each day shows where its flagged windows were. Many flags on the first or last day of a sensor point to the sensor."
      ),
      item(
        "Lows after a flag",
        "Lows in the 3 hours after a flagged window, and insulin given during it. Insulin given on a false reading can cause a real low."
      ),
    ],
    "/reports/data-quality/cgm-comparison": [
      item(
        "Scatter plot",
        "Each point is one pair of readings taken close together. Points on the dashed line read the same value. Points above it read higher on the device than on the reference."
      ),
      item(
        "MARD",
        "Mean absolute relative difference: the mean difference as a percentage of the reference. Lower is better."
      ),
      item(
        "Bias",
        "The mean of device minus reference. A negative bias means the device reads lower on average."
      ),
      item(
        "Within 15 mg/dL or 15%",
        "The share of pairs within 15 mg/dL when the reference is under 100 mg/dL, or within 15% above that. Higher is better."
      ),
    ],
    "/reports/data-quality/compression-lows": [
      item(
        "A suggestion",
        "A fast drop during sleep, followed by a fast recovery. This pattern often comes from lying on the sensor."
      ),
      item(
        "Pending, accepted, dismissed",
        "Pending needs your review. Accepted marks a false low and removes it from Loop analysis. Dismissed keeps it as a real low."
      ),
      item(
        "Accept or dismiss",
        "Accept when you slept on the sensor and felt no low. Dismiss when you had symptoms or a finger-stick check confirmed the low."
      ),
    ],
    "/reports/data-quality/rejected-uploads": [
      item(
        "One row",
        "One record that an uploader sent, with the time, the uploader, the reason and the record itself."
      ),
      item(
        "Reason",
        "Why Nocturne did not store it, for example a value that does not fit the field. Correct the cause in the uploader or its settings."
      ),
      item("Empty list", "No records were rejected. This is the normal state."),
    ],
    "/reports/treatments": [
      item(
        "One row",
        "One recorded event: a bolus, carbs, a finger-stick check, a note or a device event, with its time and value."
      ),
      item(
        "Category and search",
        "The tabs show one type of event. Search finds text in the events. The count above the list shows how many records match."
      ),
      item(
        "Edit and delete",
        "A change here changes every chart and report that uses the record. A deleted record cannot be recovered."
      ),
    ],
    "/reports/battery": [
      item(
        "Current and average level",
        "The newest battery level of each device and its mean over the period."
      ),
      item(
        "Time distribution",
        "The share of time above 80% and below 30%. Much time below 30% means the phone or uploader often runs low."
      ),
      item(
        "Warnings and critical",
        "How often the level dropped below 30% (warning) and below 20% (critical)."
      ),
      item(
        "Charge cycles",
        "Each cycle runs from one charge to the next. Lasted shows how long the battery ran. A shorter cycle than usual can point to an old battery or a busy app."
      ),
    ],
  };
}
