import type { HelpSection } from "./documentation-types";

const items = (pairs: [string, string][]): HelpSection[] =>
  pairs.map(([title, text]) => ({ title, text }));

/** What each settings and administration page shows, and what its values mean, by page address. */
export function settingsMeanings(): Record<string, HelpSection[]> {
  return {
    "/settings": items([
      [
        "Yours or the tenant's",
        "Account, Appearance, and Active access are yours. The other categories change the record of the selected tenant, so every member sees the change.",
      ],
      [
        "A missing category",
        "Nocturne shows only the categories that your role permits. A missing category is not an error.",
      ],
    ]),
    "/settings/account": items([
      [
        "Passkeys",
        "Each row is a device or security key that can sign you in. Created and Last used show when it was added and last used. A passkey that you never use is a backup.",
      ],
      [
        "Linked sign-in methods",
        "Each row is an account at Google, Microsoft, GitHub, or another provider that can sign you in. The email is the address of that provider account.",
      ],
      [
        "Authenticator apps",
        "When at least one app is listed, every sign-in also requires its 6-digit code. The code changes every 30 seconds.",
      ],
      [
        "Recovery codes",
        "The badge shows the number of unused codes. A red badge means 2 or fewer codes are left. Generate new codes before you use the last one.",
      ],
      [
        "Account details",
        "Session expires is the time at which you must sign in again. Roles and Permissions show what you can do in the selected tenant, not in other tenants.",
      ],
    ]),
    "/settings/patient": items([
      [
        "Clinical information",
        "These details describe the person, not the account. The timezone sets the local hours for alerts and schedules. Sex and date of birth select the typical ranges in sleep reports.",
      ],
      [
        "Devices and the order",
        "Current means that the device has no end date. If two CGMs send readings at the same time, the higher device in the list supplies the charts, statistics, and alerts. The readings of the other CGM stay stored.",
      ],
      [
        "Discovered sources",
        "Each row is a stream of readings that is not linked to a device. The count and Last seen show how active it is. When you register it, it gets priority over unregistered streams.",
      ],
      [
        "Insulins",
        "DIA is the duration of insulin action in hours. Unless another app manages the profile, the rapid-acting insulin in use sets the action time for insulin on board and predictions.",
      ],
    ]),
    "/settings/appearance": items([
      [
        "Glucose ranges",
        "Very low is below 3.0 mmol/L (54 mg/dL). Low is 3.0 to 3.8 mmol/L (54 to 69 mg/dL). In range is 3.9 to 10.0 mmol/L (70 to 180 mg/dL). High is 10.1 to 13.9 mmol/L (181 to 250 mg/dL). Very high is above 13.9 mmol/L (250 mg/dL). Tight range, 3.9 to 7.8 mmol/L (70 to 140 mg/dL), is part of in range.",
      ],
      [
        "Fixed bands and your target",
        "These color bands are the standard clinical bands and are the same for everyone. Your personal target from the therapy profile shows as a separate line on the chart.",
      ],
      [
        "Line color mode",
        "Threshold bands colors each part of the line with the band color. Continuous gradient changes the color smoothly with the value. Single color uses one color for the full line.",
      ],
      [
        "Area fill",
        "Outside target only fills the space between the glucose line and the target range when glucose is out of range. Then you can see quickly how far and how long glucose was out of range.",
      ],
      [
        "Smoothed and unsmoothed",
        "Smoothed values remove sensor noise but react later. Unsmoothed values react faster but jump more. This setting changes only the display, never the stored readings.",
      ],
    ]),
    "/settings/profile": items([
      [
        "Basal rates (U/hr)",
        "The insulin per hour that the pump is set to give in the background. Each row starts at its time and applies until the time of the next row.",
      ],
      [
        "Carb ratios (g/U)",
        "The grams of carbs that one unit of insulin covers. A higher number means less insulin for the same meal.",
      ],
      [
        "Insulin sensitivity (ISF)",
        "The expected drop in glucose from one unit of insulin, in your glucose unit per unit. A higher number means that one unit has a stronger effect.",
      ],
      [
        "Target range",
        "The glucose range that the profile aims for. It shows as a reference line on the charts. It does not change the colors of the standard range bands.",
      ],
      [
        "DIA, Carbs/hr, and Delay",
        "DIA is the hours that insulin stays active. Carbs/hr is the grams of carbs absorbed per hour for carbs on board. Delay is a value from the source app.",
      ],
      [
        "Badges and the switch card",
        "Default is the profile that applies without a switch. Read-only means that another app manages it. The switch card shows the percentage, the time shift, and when the switch started and ends.",
      ],
    ]),
    "/settings/data-quality": items([
      [
        "Sleep schedule",
        "Bedtime and wake time mark the night in overnight analysis. They do not change alerts.",
      ],
      [
        "Compression low",
        "A compression low is a short, sharp drop that recovers quickly, often while you lie on the sensor. The detection sends a suggestion that you confirm or dismiss in the data quality report.",
      ],
      [
        "Deduplicate records",
        "Two sources can upload the same event, such as a bolus from the pump and from the loop app. Deduplication links these copies, so that totals count each event once.",
      ],
    ]),
    "/settings/trackers": items([
      [
        "The large number",
        "This is the time left until the expected end. Without a lifespan, it is the age of the tracker. Overdue in red means that the expected end has passed.",
      ],
      [
        "Border colors",
        "The border shows the highest threshold that the tracker reached. Blue is Info, yellow is Warning, orange is Hazard, and red is Urgent.",
      ],
      [
        "Age and start",
        "Below the name, old shows the time since the start, and Started shows the date. Ages show as 45m, 6h, or 3d 4h.",
      ],
      [
        "History",
        "Each completed tracker shows how long it ran and the reason, such as Completed, Failed, Fell off, or Replaced early. Use the reasons to see how often a sensor or site fails early.",
      ],
    ]),
    "/settings/access": items([
      [
        "Sessions",
        "Each row is a browser that is signed in to your account. This device marks the one that you use now. Last active and IP help you identify a session.",
      ],
      [
        "An unknown session",
        "If you do not recognize a session, sign it out. Then add a new passkey or recovery codes if you think that someone else has your sign-in method.",
      ],
    ]),
    "/settings/members": items([
      [
        "Roles",
        "Owner has full control. Administrator manages data, members, and settings. Caretaker logs treatments and manages alerts. Clinician reads everything without changes. Viewer sees only glucose and reports.",
      ],
      [
        "Badges on a member",
        "Direct permissions are permissions in addition to the roles. 24-hour limit means that the member sees only the most recent 24 hours. Joined and Last active show the dates.",
      ],
      [
        "Pending invites",
        "Each invite shows its role, its expiry date, and how many times it was used, such as 1/3 uses. Used by lists the people who joined with it.",
      ],
      [
        "Guest link status",
        "Pending means that nobody used the code yet. Active means that a device is signed in for 48 hours. Expired and Revoked links no longer give access.",
      ],
      [
        "Public access",
        "The summary sentence tells you exactly which categories and which time window anyone with the link can see. If no category is on, the link shows nothing.",
      ],
    ]),
    "/settings/audit": items([
      [
        "Data changes",
        "Each row shows the time, who made the change, the action, and the type of record. System means that Nocturne made the change. Select a row to see the reason and the changed fields.",
      ],
      [
        "Actions",
        "Create, Update, and Delete change one record. Bulk delete removed many records at once. Restore brought back a deleted record. Allow re-import let deleted records come back on the next import.",
      ],
      [
        "Data access",
        "Each row shows who read data, the address that was used, the type of record, the number of records returned, and the result code. A code from 200 to 299 means success.",
      ],
      [
        "The counters",
        "The number on each tab is the total in the date range. The list shows only the most recent entries.",
      ],
    ]),
    "/settings/migration": items([
      [
        "Connection test",
        "A successful test shows the number of entries and treatments that Nocturne found. If the numbers are much lower than you expect, check the URL and the date range.",
      ],
      [
        "Progress",
        "Each collection shows documents migrated against the total. The percentage is for the full job.",
      ],
      [
        "History status",
        "Completed means that the job finished. Failed shows the reason. Interrupted means that the server stopped during the job. Canceled means that someone stopped it.",
      ],
      [
        "Running it again",
        "A second migration of the same source updates the records that it already imported. It does not make duplicates, and records that you deleted do not come back.",
      ],
    ]),
    "/settings/translations": items([
      [
        "The language list",
        "Each language shows its name in English and in the language itself, with its code.",
      ],
      [
        "Untranslated text",
        "If a message has no translation, Nocturne shows the English text in its place.",
      ],
    ]),
    "/settings/weight": items([
      [
        "Each entry",
        "An entry shows the weight in kilograms and the time of the measurement. The newest entry is the current weight.",
      ],
      [
        "How Nocturne uses it",
        "Nocturne keeps weight as a record of the patient. It does not use weight in insulin or glucose calculations.",
      ],
    ]),
    "/settings/timezone": items([
      [
        "Each entry",
        "An entry shows a timezone and the local date and time of arrival. It applies until the next entry.",
      ],
      [
        "When it matters",
        "If readings from Glooko appear one or more hours early or late, the timezone history is probably wrong for that period.",
      ],
    ]),
    "/settings/nightscout-transition": items([
      [
        "Migration status",
        "The counts show the records per type that Nocturne copied from Nightscout. Complete means that all old records were processed.",
      ],
      [
        "Write-back health",
        "Nocturne also sends new data to Nightscout. Circuit open means that Nocturne paused these sends after failures. It tries again later.",
      ],
      [
        "API compatibility",
        "The score is the percentage of compared fields that were the same in Nocturne and Nightscout. Below 95 percent, check the discrepancies before you disconnect.",
      ],
      [
        "Safe to disconnect",
        "Safe means that no blockers remain. Almost ready and Not ready list the blockers, such as a connector that is not configured or an unhealthy write-back.",
      ],
    ]),
    "/settings/admin": items([
      [
        "Identity providers",
        "Each provider shows its name and whether it is enabled. An enabled provider appears as a button on the sign-in page.",
      ],
      [
        "Integrations",
        "Each chat platform shows whether its bot is enabled. A bot sends alerts and answers questions in that platform.",
      ],
    ]),
    "/settings/admin/tenants": items([
      [
        "Status",
        "Active means that members can use the tenant. Inactive means that it is not available.",
      ],
      [
        "Platform administrators",
        "A switch that is on means that this member can manage every tenant on the instance. This is not a role inside the tenant.",
      ],
      [
        "Database capacity",
        "Used shows the database size as a percentage of the budget, 2048 MiB by default. The database size pill warns from 60 percent and is urgent from 75 percent. Nothing is blocked when it is full.",
      ],
    ]),
    "/settings/admin/connector-cursors": items([
      [
        "Connector status",
        "Healthy means that the last sync worked. Unhealthy shows the last error. Last successful sync and Last attempt show the times.",
      ],
      [
        "Reset progress",
        "Each connector goes from Queued to Re-pulling to Reset, or to Failed. Records that come in again do not make duplicates.",
      ],
    ]),
    "/settings/access-requests": items([
      [
        "Each request",
        "A request shows the name and the message that the visitor typed, and how long ago they sent it. Nocturne does not check the name.",
      ],
    ]),
    "/oauth/consent": items([
      [
        "Additional permissions",
        "If the title says Additional permissions, the app already has access. New permissions requested lists only the new access. Previously approved lists what it already has.",
      ],
      [
        "The warnings",
        "Not in the known app directory means that Nocturne cannot identify the app. Full access means that the app can also delete data.",
      ],
    ]),
    "/oauth/device": items([
      [
        "The result",
        "Device authorized means that the device now has access. Authorization denied means that it gets nothing. Code expired means that you must start again on the device.",
      ],
    ]),
    "/settings/translations/[locale]": items([
      [
        "The counter",
        "The top line shows how many messages are translated or drafted, out of all messages. The draft count shows how many edits wait for Submit.",
      ],
      [
        "Message status",
        "Translated means that Nocturne has a translation. Untranslated means that users see English. Fuzzy means that the English text changed, so check the old translation. Draft means your unsent edit.",
      ],
    ]),
    "/settings/connectors/[connector]": items([
      [
        "Active or Inactive",
        "The badge shows whether the connector is enabled and syncs data. Inactive means that it does not import anything.",
      ],
      [
        "Sync capabilities",
        "Supported data types lists what the connector can import. Max historical days is how far back it can download. If historical sync is not supported, it cannot fill old gaps.",
      ],
      [
        "Fill in missing history",
        "A normal sync only looks for data newer than your newest reading. A history download fetches everything from the day you choose. Readings you already have are kept, not duplicated.",
      ],
    ]),
    "/settings/support": items([
      [
        "About Nocturne",
        "Commit and Built identify the exact version of the server. Give these values when you report a problem.",
      ],
      [
        "Diagnostic logs",
        "The logs contain technical details only. They never contain glucose data, API tokens, or passwords.",
      ],
    ]),
    "/settings/integrations/discord": items([
      [
        "Linked accounts",
        "Each row is a Discord account linked to your Nocturne account. The label is the name that you type after /bg in Discord.",
      ],
      [
        "Default",
        "The default link answers /bg when you type no label.",
      ],
    ]),
    "/settings/connectors": items([
      [
        "Active, Stale, and Inactive",
        "Active means data arrived in the last 15 minutes. Stale means 15 to 60 minutes ago. Inactive means more than 60 minutes ago. Some connectors use longer times because they sync less often.",
      ],
      [
        "Counts",
        "The total is the number of records from that source. In 24h is the number from the last 24 hours. Hover over it to see the count per data type.",
      ],
      [
        "Sync status",
        "Syncing and Sync complete show a running or finished sync. Backing off means that the source refused requests, so Nocturne waits before it tries again. Error shows the last message.",
      ],
      [
        "Connected apps and tokens",
        "Each app or token shows its permissions and when it was last used. Revoke one that you do not recognize.",
      ],
    ]),
  };
}
