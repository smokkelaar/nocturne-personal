import { guide } from "./guide.svelte";
import type { HelpArticle } from "./documentation-types";

/**
 * Extra collapsed sections, so a page guide stays short until a reader asks for
 * detail.
 */
function withDetails(
  article: HelpArticle,
  details: [string, string][]
): HelpArticle {
  article.sections.push(...details.map(([title, text]) => ({ title, text })));
  return article;
}

export function pageArticles(): HelpArticle[] {
  return [
    guide(
      "/",
      "Dashboard",
      "See your current glucose, its trend, and what happened around it.",
      "Readings, treatments, device status, loop data, trackers, and profiles from your uploaders and connectors. The large value is always the newest sensor reading. The chart below it shows the recent hours.",
      "Use the chart's time buttons, zoom, and legend on this page. Settings → Appearance chooses units, theme, and which widgets appear at the top. Therapy holds your targets and schedules. Connectors & Apps manages incoming data. Alerts decides when you are notified.",
      "The same stored records feed the calendar, time spans, reports, clock faces, and alerts. A record corrected in Treatments changes all of them.",
      "Check the age of the newest reading first. When uploads stop, the value stays on screen but grows older and loses its trend arrow. Gaps and missing treatments limit what the chart can tell you. Report bands, personal targets, and alert thresholds serve different purposes.",
      [
        "/help/getting-started",
        "/help/troubleshooting",
        "/reports",
        "/settings/connectors",
        "/settings/appearance",
        "/alerts",
      ]
    ),
    withDetails(
      guide(
        "/calendar",
        "Calendar",
        "See every day of a month at a glance and open any day in detail.",
        "Each day uses the glucose readings, boluses, carbs, and basal stored for that calendar day in the patient's timezone. Tracker icons come from your active tracker runs and recently completed runs. A shared view without access to treatments shows zero carbs and insulin.",
        "Use the arrows or Today to change month. The view switch shows either Time in range bars or a Daily glucose profile per day. Show TIR % adds the in-range percentage to each bar. Hover over a day for its percentages, carbs, bolus, basal, and average glucose. The week starts on the day your regional format uses.",
        "Select a day to open it in Day in Review. Below the grid, the month summary shows average time in range, average glucose, average daily carbs, and average total daily dose.",
        "The bars use the shared report bands, not your personal targets or alert thresholds. Percentages are weighted by the time the readings cover, so a day with gaps rests on fewer hours. A day without readings shows only its number. If the patient's timezone is unknown, the calendar cannot place readings on days and shows a notice instead.",
        ["/reports/day-in-review", "/settings/trackers", "/settings/timezone"]
      ),
      [
        [
          "Tracker icons on a day",
          "An icon marks a tracker that started, was due, or was completed on that day. A due icon takes the color of the urgency the tracker has reached. Select an icon to see when the run started and how old it is, and to complete it from the calendar. If trackers cannot be loaded, the calendar still shows glucose and says so above the grid.",
        ],
        [
          "How the month averages are calculated",
          "Average time in range and average glucose use only days with readings. Average daily carbs and average total daily dose divide by the days of the month so far, including days without data. A month with missing insulin uploads therefore shows a lower average dose.",
        ],
      ]
    ),
    guide(
      "/time-spans",
      "Time Spans",
      "See which pump mode, profile, basal delivery, override, or activity was active over a period.",
      "Pump mode, override, and activity spans from your uploader or connector, profile activations, and basal delivery spans derived from the pump's basal records. Activities include exercise, illness, and travel.",
      "The page opens on the last 7 days. The arrows move the period by its own length. The date range picker offers presets and custom dates. The buttons above the timeline show or hide Pump modes, Profiles, Basal, Overrides, and Activities. Dates and hidden rows are kept in the page address, so you can bookmark the view.",
      "The same spans appear as optional tracks under the dashboard chart and give context to basal and loop reports.",
      "A span without an end is still running and is drawn up to the end of the period. Spans are cut off at the edges of the period. An empty row means your source sent nothing for that category, not that the state never occurred.",
      [
        "/settings/connectors",
        "/reports/basal-analysis",
        "/reports/loop-analysis",
      ]
    ),
    withDetails(
      guide(
        "/clock",
        "Clock",
        "Make full-screen clock faces for a bedside tablet, a wall screen, or a desktop window.",
        "A face shows this tenant's newest glucose and, depending on its elements, trend, change, reading age, IOB, COB, trackers, the time, your own text, or a chart. An open clock refreshes glucose every 30 seconds.",
        "New clock creates a face and opens the builder. Edit opens the builder for an existing face. Open shows it full screen. Creating, editing, and deleting faces needs the sharing.manage permission. Other members can only open them.",
        "Each face has its own link. Anyone with that link sees live glucose without signing in, so treat it like a share link. Delete the face to stop the link working.",
        "When readings stop, the clock keeps showing the last value with its age. Once the reading is older than the face's stale threshold, 13 minutes by default, the current time is shown as well. A face has its own glucose units, which can differ from Appearance.",
        ["/clock/config/[id]", "/settings/appearance", "/settings/members"]
      ),
      [
        [
          "Set up a bedside or wall clock",
          "Create a face, add the elements you want, and save it. Select Copy link in the builder and open that link on the tablet or screen, then switch the browser to full screen. Turn on screensaver mode for a screen that stays on all night. Hover over the top edge of an open clock to go back or to edit it.",
        ],
      ]
    ),
    guide(
      "/clock/config/[id]",
      "Clock builder",
      "Design one clock face: its rows of elements, its display settings, and its link.",
      "The face's saved layout, a live preview using this tenant's data, and your tracker definitions for tracker elements.",
      "Add elements with the plus buttons above and below the rows, or drag elements between rows. Elements are grouped as Glucose (BG, Delta, Arrow, Age, Summary), Loop (IOB, COB), Trackers, and Display (Time, Text, Chart). Select an element to change its font, size, color, and options. Dynamic color follows the glucose status. A chart can serve as the background. Undo and redo cover your edits.",
      "Display settings hold the glucose units, time format, background color or image, stale threshold, Always show time, and screensaver mode. Members who may read alerts can also turn on Show firing alerts and Let viewers mark alerts as seen. Save stores the face. Copy link copies its public address and Preview opens it.",
      "Changes apply only after Save. Showing firing alerts reveals them to anyone with the link, and marking as seen lets those viewers act on them without signing in. A tracker element can be hidden until the tracker reaches a chosen urgency.",
      ["/clock", "/settings/trackers", "/alerts"]
    ),
    guide(
      "/food",
      "Food",
      "Keep a list of the foods you eat regularly, with their carbs per portion.",
      "Foods added here or imported into this tenant. Each food has a name, portion and unit, carbs, a glycemic index level, and optional fat, protein, energy, category, and subcategory.",
      "Search matches names, categories, and subcategories. Favorites shows only starred foods. Sort by name, by carbs, or by recently added, and filter by category or GI level. Add food needs a name, carbs, and a portion size. Save & add another keeps the portion, unit, GI, and category for the next food. Select a row to edit or delete it.",
      "Foods can be attached to carb entries on the Meals page and when you record carbs. Deleting a food that meals already use keeps those meals and changes their food to Other.",
      "Carbs are per portion as entered, so check the portion size and unit. A food in the list is not a record that you ate it. The Export and Import CSV buttons are not available yet.",
      ["/meals", "/reports/treatments"]
    ),
    withDetails(
      guide(
        "/meals",
        "Meals",
        "Review your meals by day and attach foods to carb entries when you want more detail.",
        "Each meal is a carb entry with the foods attached to it and the insulin given with it. Suggestions come from food entries that a connector such as MyFitnessPal imported.",
        "Pick a date range or show only unattributed meals. Search by food name or note, filter on specific foods, and sort by time, meal, carbs, or insulin. Expand a meal to add, edit, or unlink a food, or to add or edit the bolus for that meal.",
        "Meal timing, carbs, and insulin give context beside glucose in Day in Review and the treatment reports. Attributed foods show what a carb entry consisted of.",
        "An unattributed meal still counts its carbs everywhere. Missing foods do not mean no meal. A glucose change after a meal does not prove that the meal caused it.",
        ["/food", "/reports/day-in-review", "/reports/treatments"]
      ),
      [
        [
          "How meal suggestions work",
          "Nocturne suggests a connector food entry for a carb entry when it was eaten within 30 minutes of it and its carbs differ by no more than 10 g or 20 percent. Closer times weigh more than closer carb amounts. Accept lets you correct the carbs and the time before linking. Dismiss hides the suggestion. Without a date range, suggestions are shown for today.",
        ],
      ]
    ),
    guide(
      "/tools",
      "Tools",
      "Practical helpers for daily diabetes management.",
      "Each tool uses your own recent data where that helps, such as your average insulin use.",
      "Select a tool to open it. The packing calculator is available now.",
      "Tools prepare things for you, such as a packing list. They do not change your records.",
      "A tool gives an estimate. Check the result against your own supplies and situation.",
      ["/tools/packing"]
    ),
    withDetails(
      guide(
        "/tools/packing",
        "Packing",
        "Estimate the supplies to take on a trip and turn them into a checklist.",
        "Your trip length, a default change interval per item, your average total daily dose over the last 14 days, and your own average change intervals from the last 90 days of device events such as sensor starts, site changes, and reservoir changes.",
        "Enter the trip length in days. Turn items on or off in Insulin, CGM, Pump, Testing, and Emergency. For items you change on a schedule, set how often you change them and how many spares to add. For insulin, set the units per pen or vial and the buffer. For other items, enter the quantity. Generate packing list opens the checklist.",
        "When Nocturne finds your own change interval for an item, it fills it in and shows it below the item. Your average daily insulin use appears at the top.",
        "This is an estimate. Insulin stays at zero without at least two recent days of insulin data. Add it on the list yourself in that case. Check expiry dates, delays, and your care team's advice on spares before travelling.",
        ["/tools/packing/list", "/reports/insulin-delivery"]
      ),
      [
        [
          "How quantities are calculated",
          "Scheduled items: trip days divided by the change interval, rounded up, plus the spares. Insulin: average daily dose times trip days, plus the buffer, divided by the units per pen or vial and rounded up. The defaults are one spare per scheduled item and a 50 percent insulin buffer. Changes less than 12 hours apart are ignored when your own interval is calculated.",
        ],
      ]
    ),
    guide(
      "/tools/packing/list",
      "Packing list",
      "Tick off supplies as you pack and add anything else you need.",
      "The items and quantities from the packing calculator, plus custom items you add. They are stored in the page address.",
      "Check items as you pack them. Select a name to rename it, remove items you do not need, add an item to a category, or use Add custom item. The counter shows how many items are packed.",
      "Bookmark the page or send yourself the link to keep the list. Opening it requires signing in.",
      "Ticks are not saved. They reset when you reload the page or open the link elsewhere. A ticked item is a reminder, not proof that it is in your bag.",
      ["/tools/packing"]
    ),
    guide(
      "/notifications",
      "Notifications",
      "See which tracker reminders need attention now and which tracker runs have ended.",
      "Active tracker runs and the notification thresholds set in Notifications & trackers. Active notifications update live.",
      "Manage opens the tracker settings. The history groups completed runs by day, with the newest day expanded. Select a day to expand or collapse it.",
      "Each active notification shows its level (warning, hazard, or urgent), the tracker's age, and when it started. History shows each run's duration and why it ended, such as completed, expired, or fell off.",
      "This page shows tracker notifications only. Alerts from your alert rules are on Alert Rules and in Alert History.",
      ["/settings/trackers", "/alerts", "/alerts/history"]
    ),
    withDetails(
      guide(
        "/alerts",
        "Alert Rules",
        "Rules decide when Nocturne notifies you, how urgently, and through which channels.",
        "Rules are checked on every new glucose reading. Rules about elapsed time, such as signal loss, stale data, sensor or site age, and time since the last carbs or bolus, are also checked every 30 seconds between readings. Facts come from glucose, predictions, treatments, device status, loop data, trackers, and state spans.",
        "New rule opens the editor. Each rule has an on/off switch, edit, delete, and a test fire. The overview shows how many rules are enabled, active now, and fired this week, and lets you acknowledge active alerts. A banner lists rules that need review. Changing rules needs the alerts.readwrite permission.",
        "A firing rule is delivered once to all of its channels and stays active until its condition stops or auto-resolve ends it. Acknowledging tells others that someone is on it. Where alerts reach you links to linked accounts such as Discord.",
        "Alerts depend on fresh data and working channels. Rule thresholds are separate from report bands and therapy targets. Keep the alarms of your CGM or pump app on as a backup.",
        ["/alerts/[id]", "/alerts/simulator", "/alerts/history", "/alerts/dnd"]
      ),
      [
        [
          "Severity levels",
          "Info is delivered once and acknowledged automatically. Warning waits for someone to acknowledge it while it is active. Critical behaves like warning and also always comes through Do not disturb.",
        ],
        [
          "Snoozing and escalation",
          "An active alert can be snoozed a limited number of times, three by default. To escalate, add a second rule whose condition is the alert state of the first rule, unacknowledged for a number of minutes, and give it a stronger channel.",
        ],
        [
          "When an alert does not arrive",
          "Check that the rule is enabled and that recent data reached Nocturne. Check Do not disturb and whether the rule may pass it. Use Alert History to see if it fired, then check the channel and linked account. The simulator shows whether the condition was met at all.",
        ],
      ]
    ),
    withDetails(
      guide(
        "/alerts/[id]",
        "Alert rule editor",
        "Define one alert: its name, severity, condition, channels, auto-resolve, and smart snooze.",
        "The rule as saved for this tenant, your other rules for alert-state conditions, and the tenant's available channels. Which channel kinds can be added depends on the server's configuration.",
        "Identity holds the name, description, severity, and Allow through Do not disturb. Condition combines facts in groups where all conditions must hold or any is enough. Groups can be nested, and a group can require its facts to hold for at least a number of minutes. Channels lists where the alert goes. All channels are used at the same time.",
        "Fire saved rule sends a real test notification to the rule's channels. Historic firings lists when the rule fired. Replay opens that moment in the simulator, and the calendar button opens Day in Review.",
        "Changes only apply after saving. Thresholds are strict: a rule for below 70 fires at 69, not at 70. A rule whose condition cannot be evaluated, for example because it refers to a deleted rule or tracker, is flagged for review and does not fire.",
        ["/alerts", "/alerts/simulator", "/alerts/history"]
      ),
      [
        [
          "Available facts",
          "Glucose: value above or below a threshold, glucose band, predicted value within a number of minutes, rate of change, trend arrow, and data age. Insulin and carbs: IOB, COB, temporary basal, sensitivity ratio, and time since the last carbs or bolus. Device: reservoir, site age, sensor age, tracker age, pump and phone battery, loop not cycling or not enacting, and signal loss. State: pump suspended, override, Do not disturb, pump mode, state spans, and sleep. Time: time of day and day of week. Alert: the state of another rule.",
        ],
        [
          "Channels",
          "In-app sends to the Nocturne notification center. Discord, Slack, and Telegram can send a direct message to the account you linked, or post in a channel or group the Nocturne bot has joined. Email and WhatsApp send to an address or phone number, and a webhook posts to your own URL with an optional signature. A device action sends the alert to a registered device.",
        ],
        [
          "Auto-resolve and smart snooze",
          "Auto-resolve ends the alert when its own condition becomes true, such as glucose back above 80. A suggestion can be derived from the firing condition. After an auto-resolve the rule fires again only once the problem returns. Smart snooze extends a snooze while its conditions hold. Without conditions it only extends high and low glucose alerts while glucose clearly moves back toward range.",
        ],
      ]
    ),
    guide(
      "/alerts/simulator",
      "Alert Simulator",
      "Replay your rules against past data to see when they would have fired. Nothing is sent.",
      "Your stored readings and other data as they were at each moment, checked every 5 minutes over the chosen window. Do not disturb is applied, so a silenced alert is shown as suppressed.",
      "Pick a day in the calendar and, if you like, a from and to time. Without a day the replay covers the last 24 hours. A to time earlier than the from time runs overnight into the next day. Drag across the chart to zoom in, and use the playback strip to step through it. Day in review opens the same day.",
      "Use it to tune thresholds and durations before relying on a rule, or to understand why an alert fired.",
      "The replay ignores snoozes and acknowledgements and checks every 5 minutes, so it can show more or slightly different fires than you received. It shows what would have happened, not what was delivered. Use Alert History for real alerts.",
      ["/alerts", "/alerts/history", "/reports/day-in-review"]
    ),
    guide(
      "/alerts/history",
      "Alert History",
      "Look back at every real alert from this tenant.",
      "Recorded alerts with their rule, severity, start and end time, duration, and whether they were acknowledged. Test fires are not shown.",
      "Use Previous and Next to page through, 25 alerts at a time. Change rules on Alert Rules. In the rule editor, Historic firings shows the same history for one rule with a replay button.",
      "History tells you which rule fired, for how long, and whether someone responded.",
      "An alert without an end time is still active. Acknowledged means someone acknowledged it. It does not prove that every channel delivered. For a delivery problem, check the channel and linked account as well.",
      ["/alerts", "/alerts/simulator", "/alerts/dnd"]
    ),
    guide(
      "/alerts/dnd",
      "Do Not Disturb",
      "Silence non-critical alerts now or on a daily schedule.",
      "The Do not disturb settings of this tenant. Scheduled times use the patient's timezone from the patient record.",
      "Manual turns Do not disturb on now, with an optional end time. Without an end time it stays on until you turn it off. Schedule sets a daily quiet window with From and To, which may cross midnight. The alerts overview and the sidebar also show an active Do not disturb and can end it.",
      "While it is active, rules that are not critical and not set to Allow through Do not disturb still fire and are recorded, but nothing is delivered.",
      "Critical rules always come through. Do not disturb does not stop data imports, reports, or the alarms in your CGM or pump app. Check the patient's timezone if quiet hours start at the wrong time.",
      ["/alerts", "/alerts/history", "/settings/timezone"]
    ),
    guide(
      "/compatibility",
      "Compatibility",
      "For developers and migrations: see where Nocturne's API answers differ from an existing Nightscout site.",
      "When the compatibility proxy is enabled on the server, every GET request to the v1, v2, and v3 API is answered by Nocturne and then also sent to the configured Nightscout in the background. Differences are stored as analyses.",
      "Metrics and per-endpoint results refresh every 5 seconds while polling is active. Filter by request path, match result, and method. Select an analysis to see status codes, response times, and each difference. This page requires full owner access.",
      "Use it to find uploaders or apps that would behave differently after switching from Nightscout to Nocturne.",
      "Only requests that actually passed through are compared. Very large responses are skipped. Fields that only Nocturne returns can show up as differences.",
      ["/compatibility/test", "/settings/nightscout-transition"]
    ),
    guide(
      "/compatibility/[id]",
      "Compatibility analysis",
      "Inspect one compared request in detail.",
      "One stored comparison between the Nightscout and Nocturne answers to the same request.",
      "The overview shows the request, the overall match, both status codes, and both response times. The list below names each difference with its kind, such as status code, array length, or a string or number value.",
      "Use the request path and method to reproduce the request on the test page.",
      "A difference can be harmless, such as an extra Nocturne field or a different number of decimals. Check whether the app that made the request depends on it.",
      ["/compatibility", "/compatibility/test"]
    ),
    guide(
      "/compatibility/test",
      "Test Endpoint Compatibility",
      "Send one request to Nightscout and Nocturne and compare the answers side by side.",
      "The responses, status codes, and times returned by your Nightscout URL and by this Nocturne instance for the same query path.",
      "Enter the Nightscout URL, the API secret, the method, the query path, optional headers, and a JSON body for POST. The secret is hashed with SHA-1 in the browser by default, as Nightscout expects. Hiding null values and the side-by-side view only change the display.",
      "The unified diff shows what differs. Known Nocturne-only fields are left out of the comparison.",
      "Results are not saved. A POST can create data on both sites. The comparison depends on both sites holding the same data.",
      ["/compatibility"]
    ),
    guide(
      "/tenants",
      "Tenants",
      "Watch the latest glucose of every tenant you can access, with the most urgent at the top.",
      "For each tenant where you may read glucose: the newest reading, its trend and status, and the number of active alerts with the highest severity. The page refreshes every minute while it is open.",
      "Select a tile to open that tenant at its own address. This page appears in the menu only when you belong to more than one tenant.",
      "Tiles are sorted by urgency: urgent low first, then urgent high, low, high, stale, in range, and unknown, and then by name.",
      "Tenants where you may not read glucose are not shown. A tile shows the last reading it found, so check its age. Access to one tenant gives no access to another.",
      ["/settings/members", "/alerts"]
    ),
    withDetails(
      guide(
        "/setup",
        "Setup",
        "Finish setting up Nocturne with a short checklist. Every item is optional.",
        "Your answers from the first setup and the state of this tenant: its data sources, alerts, devices, therapy profile, sharing, and patient details.",
        "Open an item to complete it, or mark it Not for me. Basics shows who Nocturne is for, the glucose units, and the timezone, and you can change them. Go to dashboard leaves the checklist. Only the owner sees Setup.",
        "Each item leads to the same settings you can find later in the menu. The checklist only tracks what is done.",
        "An item counts as done when the thing it sets up actually works, not when a form is saved. Done never reverts, even if you later revoke a share or delete a rule.",
        [
          "/settings/connectors",
          "/alerts",
          "/settings/profile",
          "/settings/members",
          "/settings/patient",
        ]
      ),
      [
        [
          "When an item counts as done",
          "Connect data appears only without a data source and is done when the first reading arrives. Alerts is done when a test shows that your alerts reach someone. Devices is done when a current CGM is recorded and the insulin question is answered. Therapy is done when you confirm or enter a profile. Sharing is done when someone else can get in. About is done when you saved patient details.",
        ],
      ]
    ),
  ];
}
