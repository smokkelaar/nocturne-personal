import type { HelpSection } from "./documentation-types";

const items = (pairs: [string, string][]): HelpSection[] =>
  pairs.map(([title, text]) => ({ title, text }));

/**
 * The interpretation a reader comes for, shown open at the top of a page guide:
 * what each color, figure and threshold on the page means.
 */
export function pageMeanings(): Record<string, HelpSection[]> {
  const ranges: [string, string] = [
    "Glucose ranges",
    "Very low is below 3.0 mmol/L (54 mg/dL). Low is 3.0 to 3.8 mmol/L (54 to 69 mg/dL). In range is 3.9 to 10.0 mmol/L (70 to 180 mg/dL). High is 10.1 to 13.9 mmol/L (181 to 250 mg/dL). Very high is above 13.9 mmol/L (250 mg/dL). Tight range, 3.9 to 7.8 mmol/L (70 to 140 mg/dL), is part of in range.",
  ];
  const tirTargets: [string, string] = [
    "Consensus targets",
    "At least 70% of the time in range, less than 4% below range, less than 1% very low, less than 25% above range, and less than 5% very high. These are general targets. Your care team can agree other targets with you.",
  ];
  return {
    "/": items([
      [
        "The large number",
        "Your newest sensor reading. Its color shows its status against the low, high and urgent thresholds of your enabled alert rules. Without such rules, the server's default thresholds apply.",
      ],
      [
        "Arrow and change",
        "The arrow comes from your sensor app. A flat arrow means less than 0.5 mg/dL (0.03 mmol/L) change per minute. One diagonal arrow means 0.5 to 1, one straight arrow 1 to 2, and a double arrow 2 to 3 mg/dL per minute. The number next to it is the change since the previous reading.",
      ],
      [
        "Age of the reading",
        "The time since the newest reading arrived. After 10 minutes without a new reading, treat the value and arrow as old. Connection error means the page cannot reach the server.",
      ],
      [
        "IOB and COB",
        "Insulin on board (IOB) is insulin that still works. Carbs on board (COB) are carbs that the body did not absorb yet. Both come from your loop app, or Nocturne calculates them from your treatments and profile.",
      ],
      ranges,
    ]),
    "/calendar": items([
      [
        "The colors in a day",
        "Each bar is one day, stacked from very low at the bottom to very high at the top. The height of each color is the share of that day's time in that range. In the default theme, red is very low, orange is low, teal is in range, purple is high, and dark red is very high. Other themes use their own colors.",
      ],
      ranges,
      tirTargets,
      [
        "A good month",
        "Look for days that are mostly the in-range color with little red or orange at the bottom. Repeated orange or red at the bottom points to lows that need attention.",
      ],
      [
        "Empty and partial days",
        "A day with only its number has no readings. A day with gaps uses only the hours that have readings, so its percentages can look better or worse than the day was.",
      ],
    ]),
    "/time-spans": items([
      [
        "Pump modes",
        "Automatic is closed loop. Limited is partial automation. Manual is open loop without automation. Boost gives more insulin and Ease off gives less. Sleep is the sleep mode of the pump, such as in Control-IQ.",
      ],
      [
        "Profiles, basal and overrides",
        "Profiles shows which therapy profile was active. Basal shows the delivered basal rate as blocks of time. Overrides shows temporary changes from your loop app, such as a different target.",
      ],
      [
        "Activities",
        "Exercise, illness and travel. Use them to explain unusual glucose in the same period.",
      ],
      [
        "An empty row",
        "Your source sent nothing for that category. It does not prove that the state did not occur.",
      ],
    ]),
    "/clock": items([
      [
        "What a face shows",
        "The newest glucose with, depending on its elements, the arrow, the change, the age of the reading, IOB, COB, trackers, the time and a chart. With dynamic color, the glucose takes the color of its status.",
      ],
      [
        "When the clock is old",
        "When readings stop, the clock keeps the last value with its age. After the stale threshold of the face, 13 minutes by default, it also shows the current time.",
      ],
      [
        "Who can see it",
        "Anyone with the link of a face sees live glucose without signing in. Delete the face to stop the link.",
      ],
    ]),
    "/clock/config/[id]": items([
      [
        "Elements",
        "BG is the newest glucose, Delta the change since the previous reading, Arrow the trend, and Age the time since the reading. IOB and COB are insulin and carbs on board. A tracker shows the age of a sensor, site or other tracker.",
      ],
      [
        "Dynamic color",
        "The element takes the color of the glucose status: low, in range or high.",
      ],
      [
        "Alerts on a face",
        "Show firing alerts shows active alerts to anyone with the link. Let viewers mark alerts as seen lets them acknowledge alerts without signing in.",
      ],
    ]),
    "/food": items([
      [
        "Carbs per portion",
        "The carbs are for the portion and unit on the same row. A different portion needs a different amount of carbs.",
      ],
      [
        "Glycemic index",
        "Low, medium or high GI tells how fast the carbs usually raise glucose. Food with a high GI usually acts faster than food with a low GI.",
      ],
      [
        "Favorites",
        "A star marks the foods that you use most, so that you find them faster when you record carbs.",
      ],
    ]),
    "/meals": items([
      [
        "A meal",
        "A meal is a carb entry with the foods attached to it and the insulin given with it.",
      ],
      [
        "Unattributed",
        "The carb entry has no foods attached. Its carbs still count in every report.",
      ],
      [
        "Suggestions",
        "A suggestion is a food entry from a connector, such as MyFitnessPal, eaten within 30 minutes of a carb entry, with carbs no more than 10 g or 20% different.",
      ],
      [
        "Glucose after a meal",
        "A rise after a meal shows timing, not cause. Compare the meal, the bolus and its timing with Day in review.",
      ],
    ]),
    "/tools": items([
      [
        "Estimates",
        "Tools use your own recent data, such as your mean insulin use, to make an estimate. They do not change your records.",
      ],
    ]),
    "/tools/packing": items([
      [
        "Your average daily insulin",
        "The mean total daily dose of the last 14 days. It stays at zero without at least two days of insulin data.",
      ],
      [
        "Your own change interval",
        "Calculated from the last 90 days of sensor starts, site changes and reservoir changes. Changes less than 12 hours apart are ignored.",
      ],
      [
        "Quantities",
        "Scheduled items: trip days divided by the change interval, rounded up, plus the spares. Insulin: daily dose times trip days, plus the buffer, divided by the units per pen or vial, rounded up. The default buffer is 50% and the default spare is one item.",
      ],
    ]),
    "/tools/packing/list": items([
      [
        "Ticks",
        "A tick shows what you packed. Ticks are not saved and reset when you reload the page.",
      ],
    ]),
    "/notifications": items([
      [
        "Levels",
        "Warning, hazard and urgent show how far a tracker is past its notification thresholds. Urgent needs action first.",
      ],
      [
        "How a run ended",
        "Completed means the run ended at or near its expected time. Expired means it ran past its expected life. Fell off means the device came off the body. Replaced early, Failed, Empty and Refilled give other reasons.",
      ],
    ]),
    "/alerts": items([
      [
        "Severity",
        "Info is delivered once and acknowledged automatically. Warning stays active until someone acknowledges it. Critical is like warning and always comes through Do not disturb.",
      ],
      [
        "Active, acknowledged and resolved",
        "Active means the condition is true now. Acknowledged means someone is on it. The alert ends when its condition stops or its auto-resolve condition is true.",
      ],
      [
        "Rules that need review",
        "A rule that refers to something that no longer exists, such as a deleted tracker, does not fire until you correct it.",
      ],
      [
        "Thresholds",
        "Rule thresholds are your own. They are not the report ranges or your therapy targets. Your enabled low and high rules also set the colors of the large glucose number.",
      ],
    ]),
    "/alerts/[id]": items([
      [
        "Strict thresholds",
        "A rule for below 70 fires at 69, not at 70. A rule for above 180 fires at 181.",
      ],
      [
        "All and any",
        "In an All group, every condition must be true. In an Any group, one is enough. A minimum duration makes the group wait until it was true for that many minutes.",
      ],
      [
        "Predicted glucose",
        "A prediction condition uses the forecast of your loop app. It can fire before glucose really goes out of range.",
      ],
    ]),
    "/alerts/history": items([
      ["No end time", "The alert is still active."],
      [
        "Acknowledged",
        "Someone acknowledged the alert. It does not prove that every channel delivered it.",
      ],
      [
        "Duration",
        "The time from the start of the alert to its end. A long duration without acknowledgement can mean that nobody received it.",
      ],
    ]),
    "/alerts/dnd": items([
      [
        "What is silenced",
        "Rules that are not critical and not set to Allow through Do not disturb still fire and are recorded, but nothing is delivered.",
      ],
      [
        "What still comes through",
        "Critical rules and rules set to Allow through Do not disturb. The alarms of your CGM or pump app are not affected.",
      ],
    ]),
    "/alerts/simulator": items([
      [
        "Markers on the chart",
        "A marker shows where a rule would have fired. Suppressed means that Do not disturb would have silenced it.",
      ],
      [
        "Different from what you received",
        "The replay checks every 5 minutes and ignores snoozes and acknowledgements. It can show more fires than you received.",
      ],
    ]),
    "/tenants": items([
      [
        "Order of the tiles",
        "Urgent low first, then urgent high, low, high, old data, in range and unknown.",
      ],
      [
        "Alert count",
        "The number of active alerts of that tenant, with the highest severity.",
      ],
    ]),
    "/reports/steps": items([
      [
        "The figures",
        "Total steps is the sum of the period. Daily average divides it by the days of the period, also days without data. Days follow UTC.",
      ],
      [
        "Steps and glucose",
        "Activity often lowers glucose during and for hours after it. Compare active days with Day in review.",
      ],
      [
        "How steps reach Nocturne",
        "Fitbit and Pixel Watch write to Google Health directly. Garmin, Samsung, Oura and Withings on Android write to Health Connect, and the Google Health app reads Health Connect. On an iPhone, Garmin Connect, Apple Watch and most apps write to Apple Health, and the Google Health app can read Apple Health. Then connect Google Health in Connectors & Apps and select Steps.",
      ],
      [
        "Other routes",
        "Glooko can import daily step totals from Apple Health with Use Granular Sync (Experimental) and Sync activity on. xDrip+ can upload steps from the phone or a supported watch.",
      ],
    ]),
    "/reports/heart-rate": items([
      [
        "Resting estimate",
        "The 10th percentile of the readings in the period: 90% of the readings are higher. It is close to your heart rate at rest.",
      ],
      [
        "Units and gaps",
        "Values are beats per minute. Google Health gives one average per minute, so short peaks can disappear. A gap is no data, not a heart rate of zero.",
      ],
      [
        "How heart rate reaches Nocturne",
        "Fitbit and Pixel Watch write to Google Health directly. Garmin, Samsung, Oura and Withings on Android write to Health Connect, and the Google Health app reads Health Connect. On an iPhone, Garmin Connect, Apple Watch and most apps write to Apple Health, and the Google Health app can read Apple Health. Then connect Google Health in Connectors & Apps and select Heart rate.",
      ],
    ]),
    "/reports/sleep": items([
      [
        "Average sleep and nights tracked",
        "Average sleep is the mean time asleep per night. Nights tracked shows how many nights of the period have a sleep session.",
      ],
      [
        "Sleep score",
        "The score of your device when it sends one. Otherwise Nocturne calculates it from 0 to 100: more deep and REM sleep raise it, awake time and lows lower it. Without sleep stages there is no score.",
      ],
      [
        "Overnight TIR and lows",
        "Overnight TIR is the time in range, 3.9 to 10.0 mmol/L (70 to 180 mg/dL), while you slept. Overnight lows counts the low episodes during sleep.",
      ],
      [
        "Dawn rise",
        "The change in glucose in the last 2 hours before you woke up. A rise points to the dawn phenomenon. It needs at least 4 readings in that window.",
      ],
      [
        "How sleep reaches Nocturne",
        "Fitbit and Pixel Watch write to Google Health directly. Garmin, Samsung, Oura and Withings on Android write to Health Connect, and the Google Health app reads Health Connect. On an iPhone, Garmin Connect, Apple Watch and most apps write to Apple Health, and the Google Health app can read Apple Health. Then connect Google Health in Connectors & Apps and select Sleep.",
      ],
    ]),
    "/reports/sleep/[date]": items([
      [
        "Sleep stages",
        "Deep, REM, light and awake come from your device. Asleep (unstaged) is sleep without stages, for example from a manual entry.",
      ],
      [
        "Overnight time in range",
        "Overnight time in range uses the readings between falling asleep and waking up. Compare a low with the stage at the same time in the hypnogram. No CGM data means that no readings overlap the session.",
      ],
    ]),
  };
}
