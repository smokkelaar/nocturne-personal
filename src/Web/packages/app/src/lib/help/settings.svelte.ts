import { guide } from "./guide.svelte";
import type { HelpArticle } from "./documentation-types";

/** Adds collapsed detail sections after the four standard sections of a guide. */
function withDetails(
  article: HelpArticle,
  details: [string, string][]
): HelpArticle {
  article.sections.push(...details.map(([title, text]) => ({ title, text })));
  return article;
}

export function settingsArticles(): HelpArticle[] {
  return [
    guide(
      "/settings",
      "Settings",
      "Choose the settings for your account, the patient, the display, and the connections.",
      "Account settings belong to you and follow you to every tenant. Patient record, therapy, sharing, and connectors belong to the selected tenant.",
      "Open a category from this page or the Settings menu. Platform administrators also see Platform administration. Setup starts the guided onboarding checklist again.",
      "Each category controls the matching part of Nocturne: sign-in, patient details, display, therapy context, reminders, data sources, or sharing.",
      "If a category or control is not visible, your role does not include the necessary permission. Ask an owner of the tenant. Settings always require sign-in, also on a public site.",
      [
        "/settings/account",
        "/settings/patient",
        "/settings/appearance",
        "/settings/members",
      ]
    ),
    withDetails(
      guide(
        "/settings/account",
        "Account",
        "Manage how you sign in: profile picture, passkeys, linked sign-in methods, authenticator apps, and recovery codes.",
        "Your signed-in account. Account details shows your subject ID, the expiry time of your session, and the roles and permissions you hold in the selected tenant.",
        "Add a passkey and give it a name. Link an external provider, such as Google, Microsoft, or GitHub. Add an authenticator app with the QR code and its 6-digit code. Generate recovery codes and keep them private.",
        "Passkeys and linked providers are primary sign-in methods. An authenticator app is a second step: after you add one, each sign-in also requires its code.",
        "You cannot remove your only primary sign-in method. Add another one first. An authenticator app alone cannot sign you in. The providers you can link are the ones an administrator configured.",
        ["/settings/access", "/settings/patient"]
      ),
      [
        [
          "Recovery codes",
          "Nocturne makes 8 recovery codes. Each code works once. When you generate new codes, all old codes stop working immediately. Use a code when you lost all passkeys and linked providers.",
        ],
        [
          "No sign-in method left",
          "If you have no passkey, provider, or recovery code, the server administrator can set NOCTURNE_RECOVERY_MODE. This temporary mode lets you register a new passkey. It requires access to the server environment.",
        ],
        [
          "Limits per account",
          "You can register up to 20 passkeys and up to 10 authenticator apps. Give each one a name, so that you can identify the device later.",
        ],
      ]
    ),
    withDetails(
      guide(
        "/settings/patient",
        "Patient record",
        "Describe the person whose data this tenant holds: clinical details, devices, and insulins.",
        "Details that you or another member enter. Discovered sources lists device streams from recent readings that are not linked to a device yet.",
        "Clinical information holds diabetes type, diagnosis date, date of birth, sex, preferred name, pronouns, timezone, and weight. Use Devices and Insulins to add, edit, sort, or delete entries.",
        "The timezone sets the local hours for alerts, schedules, and analytics. Sex and date of birth select the typical ranges in sleep reports. A rapid-acting insulin sets the insulin action time.",
        "Changes here do not change readings or treatments. Delete removes an entry permanently. Set an end date when you stop using a device or insulin, so that the history stays correct.",
        ["/settings/weight", "/settings/timezone", "/settings/profile"]
      ),
      [
        [
          "Timezone and weight",
          "A changed timezone applies from the moment you save. Past data keeps its times. A changed weight is added to Weight history, and the previous entry stays.",
        ],
        [
          "Devices",
          "Choose a model from the catalog, or enter a manufacturer and model. A catalog CGM also adds sensor trackers. A catalog pump adds pod, site, or reservoir trackers. Use the arrows to rank overlapping devices of one category.",
        ],
        [
          "Discovered sources",
          "Nocturne lists sources that sent readings but have no device in the patient record. Select Register as device to link a source to a device entry.",
        ],
        [
          "Insulins and action time",
          "Choose a category and formulation. The formulation fills in the duration of insulin action, peak, and concentration, and you can change them. Nocturne uses the action time of the rapid-acting insulin for insulin on board and predictions. If another app manages the profile, Nocturne uses the action time of that profile instead.",
        ],
      ]
    ),
    withDetails(
      guide(
        "/settings/appearance",
        "Appearance",
        "Choose how Nocturne looks for you: theme, units, formats, charts, dashboard, and help.",
        "Most choices are saved to your account and follow you to other devices. Help display choices are saved in this browser. Default chart range, tracker pills, and glucose processing apply to the whole tenant.",
        "Choose a color theme, glucose range colors, light or dark mode, language, units, and formats. Configure the dashboard widgets, status pills, chart lines, and the browser tab here.",
        "Display choices change how values look. Stored readings and their units stay the same. Theme changes take effect immediately.",
        "A choice that applies to the whole tenant changes the display for every member. The language preference syncs to your account only when you are signed in.",
        ["/settings/trackers", "/"]
      ),
      [
        [
          "Units and formats",
          "Glucose shows in mg/dL or mmol/L. Food energy shows in kJ or kcal. The regional format sets the date order, month names, and the first day of the week. You can show HbA1c as HbA1c or A1c.",
        ],
        [
          "Charts",
          "Default chart range sets the hours that the dashboard chart shows. Lines and points use one color, the threshold bands, or a continuous gradient. Chart patterns add textures, so that color-blind readers can tell the series apart.",
        ],
        [
          "Dashboard",
          "Choose and sort the widgets above the glucose chart and the status pills beside the glucose value. Tracker pills show the age of running trackers. Set the visibility of each tracker in Notifications & trackers.",
        ],
        [
          "Glucose processing",
          "Some sources send smoothed and unsmoothed values. Choose which value Nocturne shows, or Default for the value that the source reports. Source default rules choose per app or device, and the first matching rule wins.",
        ],
        [
          "Browser tab",
          "The browser tab can show the glucose value, direction, and change in its title and icon. Flash on alarms makes the title and icon flash during urgent glucose levels.",
        ],
        [
          "Help display",
          "Help visibility shows the full help bar, only the library icon, or no help. Layout opens help as a book, a right drawer, side by side, or in place of the page. Close help with the book, the close button, or Escape. Your page and its inputs stay in place.",
        ],
      ]
    ),
    withDetails(
      guide(
        "/settings/profile",
        "Therapy",
        "Inspect therapy profiles: basal rates, carb ratios, insulin sensitivity, and target ranges.",
        "Profiles usually come from your diabetes app, such as AAPS, Loop, or xDrip+, through an uploader or connector. A profile synced from such a source is read-only here.",
        "Select a profile to see its schedules. Make default chooses the profile that applies when no switch is active. Switch records a profile switch. You can edit the target range of a profile that Nocturne manages.",
        "Insulin on board, predictions, scheduled basal, and target overlays use the profile that applied at each moment.",
        "A scheduled basal rate does not prove that the pump delivered it. Change a read-only profile on the source device. Discuss therapy changes with your diabetes care team.",
        ["/settings/patient", "/settings/connectors", "/reports/basal-analysis"]
      ),
      [
        [
          "Profile switch",
          "A switch starts now. It can scale the profile from 30 to 250 percent and shift the schedule by -23 to 23 hours. A temporary switch lasts 1 minute to 7 days. Without a duration, it runs until you end it or another switch replaces it.",
        ],
        [
          "What a switch does not do",
          "Nocturne only records the switch. It is not sent to your pump, and AAPS and Nightscout followers do not see it. If your AID system reports the profile that the pump runs, Nocturne calculations follow that reported profile.",
        ],
        [
          "Delete a profile",
          "You cannot delete the only profile or the default profile. Deleting removes its schedules and their history. Readings and treatments stay. A synced profile comes back on the next sync. To prevent that, stop profile sync at the source.",
        ],
      ]
    ),
    withDetails(
      guide(
        "/settings/data-quality",
        "Data quality",
        "Set the sleep times and the compression low detection that overnight analysis uses.",
        "Your saved settings and the readings stored in this tenant.",
        "Choose a typical bedtime and wake time. Enable automatic detection of compression lows. Members with full access also see Data maintenance.",
        "The sleep schedule sets the overnight window for analysis. Detection notifies you about possible compression lows, so that you can review them.",
        "A detection is a suggestion, not proof that a reading is wrong. A change to these settings does not change existing readings.",
        ["/reports/data-quality", "/reports/data-quality/compression-lows"]
      ),
      [
        [
          "Compression lows",
          "A compression low is a falsely low CGM reading, caused by lying on the sensor. When you confirm one, Nocturne keeps a record for you. The readings stay in your reports and statistics.",
        ],
        [
          "Data maintenance",
          "Deduplicate records links readings, treatments, and state spans that different sources uploaded for the same event. It matches records within 30 seconds by time and value. The original records stay, so you can run it again. Remove demo data deletes only the generated sample data.",
        ],
      ]
    ),
    withDetails(
      guide(
        "/settings/trackers",
        "Notifications & trackers",
        "Track sensors, sites, reservoirs, batteries, appointments, and other recurring events, with reminders.",
        "Tracker definitions, presets, and running and completed trackers in this tenant. Your pump, loop, or a connector can also start and complete trackers.",
        "Active shows running trackers. Start, complete, or record a reservoir level there. History lists completed trackers. Definitions holds reusable templates. Presets start a tracker in one step.",
        "Tracker ages and urgency appear as pills on the dashboard. Notification thresholds send reminders through alert rules.",
        "A reminder does not confirm that you changed the device. If you delete a definition, its running trackers stay, but you cannot start new ones. Completing a tracker and editing its definition are different actions.",
        ["/alerts", "/settings/patient", "/tools/packing"]
      ),
      [
        [
          "Duration and event trackers",
          "A duration tracker runs for its expected lifespan from the start, written as 10x24 or 10d. An event tracker is scheduled for one date and time, such as an appointment. A reservoir definition can also alert when the estimated level falls below a number of units.",
        ],
        [
          "Notification thresholds",
          "Add up to 4 thresholds with a level: Info, Warning, Hazard, or Urgent. For a duration tracker, positive hours count from the start and negative hours count back from expiry. For an event tracker, negative hours are before the event.",
        ],
        [
          "Reminder delivery",
          "Each threshold gets a managed alert rule after you save the tracker. Use Channels on a threshold to open that rule and choose where the reminder goes.",
        ],
        [
          "Automatic restart",
          "Choose events under Restart automatically on. When your pump, loop, or a connector reports one, the running tracker completes and a new one starts. Use the notes filter to keep two trackers apart, such as a left and a right site.",
        ],
        [
          "Dashboard and Nightscout",
          "Dashboard visibility shows the pill always, never, or after a threshold level. Event integration can create a treatment event at start or completion, for the Nightscout CAGE and SAGE pills.",
        ],
      ]
    ),
    withDetails(
      guide(
        "/settings/access",
        "Active access",
        "See the browsers that are signed in to your account, and sign them out.",
        "The list of your active sessions on the server, with device description, last activity, and IP address.",
        "Sign out one session, or select Sign out everywhere else to keep only this device. Members who can change tenant settings also see the API reference switch.",
        "A browser that you sign out must sign in again.",
        "Signing out a session does not delete data. If you sign out the session you use now, you are signed out here.",
        ["/settings/account", "/settings/connectors", "/settings/members"]
      ),
      [
        [
          "What else can reach your data",
          "Connected apps, uploaders, and API tokens are in Connectors & apps. Members, invites, guest links, and public access are in Sharing & privacy. Revoke each one on its own page.",
        ],
        [
          "API reference",
          "The switch publishes the interactive API reference and the OpenAPI specification on this address, for anyone, without sign-in. Your data stays behind sign-in. Keep it off unless you build against the API.",
        ],
      ]
    ),
    guide(
      "/settings/connectors",
      "Connectors & Apps",
      "Connectors bring information from device services into Nocturne.",
      "Server connectors, uploaders, authorized apps, client devices, and tokens configured for this tenant.",
      "Find your source under Server Connectors and open its setup/settings. Review connection status and latest sync. Apps, uploaders, and API tokens have separate controls here.",
      "Imported records feed the dashboard, reports, and patient histories. Each connector supports its own data types.",
      "A configured connector may still need sign-in or import selection. Connected does not prove a historical import is complete. Empty data may be a permission, date, or source-sync problem.",
      [
        "/settings/connectors/google-health",
        "/reports/steps",
        "/reports/heart-rate",
      ]
    ),
    withDetails(
      guide(
        "/settings/members",
        "Sharing & privacy",
        "Choose who can see this tenant's data, and what they can do with it.",
        "Members, invites, membership requests, roles, guest links, and the public link of this tenant.",
        "Invite people with a link, edit the roles of a member, review requests, create guest links, and configure public access. The sections you see depend on your own permissions.",
        "Roles and direct permissions decide which pages, data, and actions each member gets.",
        "Anyone with a guest link or the public link sees what it allows. Revoking stops new access, but it does not remove copies that someone already made.",
        ["/settings/access", "/settings/audit", "/settings/connectors"]
      ),
      [
        [
          "Invite links",
          "An invite link lets a person join after they sign in. Choose roles, optional direct permissions, and an expiry from 1 to 90 days. By default, a link works once. Select Allow multiple uses for more people. People who joined keep access after the link expires.",
        ],
        [
          "Members and roles",
          "Edit opens the roles and direct permissions of a member. You cannot change your own roles. System roles are fixed. A custom role combines the permissions that you choose. Removing a member ends their access to all tenant data.",
        ],
        [
          "Only last 24 hours",
          "This option limits a member, invite, or request to the most recent 24 hours of data. Owners and members who manage tenant settings cannot be limited. A limited member cannot give anyone wider access.",
        ],
        [
          "Guest links",
          "A guest link gives read-only access to the categories you choose, for someone without an account. The code works once. The first device that uses it stays signed in for 48 hours. Select New code for another device.",
        ],
        [
          "Public access",
          "Public access gives anyone with your link read-only access to the categories you select, without an account. Choose All history or Last 24 hours. Regenerate stops the old link immediately.",
        ],
        [
          "Membership requests",
          "When membership requests are on, people who reach your profile can ask to join. Nothing is granted automatically. You choose the roles when you approve a request.",
        ],
      ]
    ),
    withDetails(
      guide(
        "/settings/audit",
        "Audit log",
        "See which data changed. If read access logging is on, also see who read patient data.",
        "Audit records that the server keeps for this tenant. Data changes are always recorded. Data access is recorded only when read access logging is on.",
        "Data changes and Data access each have a date filter. The list shows the most recent entries in the range. Narrow the dates to see older entries. Members who manage audit settings can change logging and retention.",
        "Use the log to see who changed a record, a setting, or a permission, and when.",
        "Only events that the server recorded appear. Reads from before read access logging was on are not in the log. Viewing the log requires the audit.read permission.",
        ["/settings/members"]
      ),
      [
        [
          "Retention",
          "Each log keeps entries for its retention in days. An empty field uses the platform default. Data change retention must be at least the retention of deleted records. Then a deletion stays attributed while the record can be restored.",
        ],
      ]
    ),
    withDetails(
      guide(
        "/settings/migration",
        "Data migration",
        "Copy historical data from an existing Nightscout into Nocturne.",
        "The Nightscout site, with its URL and API secret, or its MongoDB database, with connection string and database name.",
        "Choose the source and enter its credentials. Test connection shows the number of entries and treatments it found. Optionally choose a date range. Then select Start migration and follow it under Progress.",
        "Imported entries, treatments, device status, profiles, food, and activity appear in the normal charts and reports.",
        "One migration can run at a time per tenant. A migration is a one-time copy. Continuous data comes from connectors or uploaders. Migration requires full access to the tenant. Keep the API secret and connection string private.",
        ["/settings/connectors", "/settings/nightscout-transition"]
      ),
      [
        [
          "What is imported",
          "The Nightscout API mode reads entries, treatments, device status, profiles, food, activity, and the people and devices that can sign in. That last part requires an admin API secret, otherwise Nocturne skips it. MongoDB mode imports entries, treatments, device status, profiles, and food.",
        ],
        [
          "Read the result",
          "History shows how many collections were imported, skipped, or failed, with the reason for each. A skipped collection does not stop the others. Known sources lists each source with the time of its last migration.",
        ],
        [
          "Prepared by the server",
          "If the server is configured for migration, Nocturne fills in the form for you. Review the values before you start.",
        ],
      ]
    ),
    guide(
      "/settings/translations",
      "Translations",
      "Translate Nocturne into your language, and propose the result to the Nocturne project.",
      "The translation catalogs of this Nocturne version, and the drafts saved to your account.",
      "Choose a language. Search the messages, or show only untranslated messages or drafts. Each edit is saved as a draft. Submit sends your drafts with your name. Clear drafts deletes them.",
      "Submitted translations are proposed to the Nocturne project as a pull request, with your name in the credit. After review, they appear in a later version.",
      "Choose your interface language in Appearance. Untranslated text shows in English. Keep placeholders and markup tags exactly as they are in the English text.",
      ["/settings/appearance"]
    ),
    guide(
      "/settings/weight",
      "Weight history",
      "Review and record dated body weights.",
      "Entries that you add here, a changed weight in Patient record, and supported imports such as Google Health.",
      "Add the weight in kilograms with the time it was recorded. Without a time, Nocturne uses the current time. Delete removes one entry.",
      "Each entry is a dated point in the weight history. A changed weight in Patient record adds a new entry, and the last entry stays.",
      "Enter the real measurement time for an older weight. Two sources can record the same weighing twice. A missing entry does not mean zero weight.",
      ["/settings/patient", "/settings/connectors/google-health"]
    ),
    guide(
      "/settings/timezone",
      "Timezone history",
      "Tell Nocturne where the patient was over time, so that readings from local-clock sources land at the right moment.",
      "Some sources, such as Glooko, record times in local clock time. Nocturne fills in your home timezone automatically on the next sync.",
      "Add a location change with the timezone and the local date and time of arrival. Fix already-imported data imports recent Glooko data again with corrected times.",
      "Nocturne converts local-clock times from those sources with the timezone that applied at that moment. Daylight saving is handled automatically.",
      "A new entry only changes data that arrives after it. Re-import recent data corrects saved readings in place, without duplicates. The timezone in Patient record is a different setting, for alerts and schedules.",
      ["/settings/patient", "/settings/appearance"]
    ),
    guide(
      "/settings/support",
      "Support & Community",
      "Find support links and deployment information.",
      "Server service status, version information, and details you choose to include in a report.",
      "Use the support and issue controls here. Review optional device information and your message before submitting. Tutorial preferences are also here.",
      "Version and error details help maintainers understand a reproducible problem.",
      "Describe the page, expected result, and steps to reproduce. Keep credentials, tokens, and identifiable health records out of a public issue.",
      ["/settings/connectors"]
    ),
    guide(
      "/settings/nightscout-transition",
      "Nightscout Transition",
      "Inspect the transition status between Nightscout and Nocturne.",
      "Server transition configuration and recorded transition status.",
      "Review the status on this page. Migration history is under Data Migration. Ongoing data sources are under Connectors & Apps.",
      "The status helps the administrator see how the deployment is progressing.",
      "Availability depends on the server's transition configuration. It is not a control for changing glucose values.",
      ["/settings/migration", "/settings/connectors"]
    ),
    withDetails(
      guide(
        "/settings/admin",
        "Administration",
        "Configure identity providers and chat integrations for the whole instance.",
        "Instance settings stored on this server. They apply to every tenant. Only platform administrators can open this page.",
        "Identity providers adds, edits, enables, or deletes OpenID Connect and OAuth 2.0 providers for single sign-on. Integrations configures chat bots for Discord, Slack, Telegram, and WhatsApp.",
        "Enabled providers appear on the sign-in page and under Account, as linked sign-in methods.",
        "If some members sign in only through a provider, disabling or deleting it locks them out. Nocturne warns you first. Those members then need a recovery code.",
        ["/settings/admin/tenants", "/settings/account"]
      ),
      [
        [
          "Add an identity provider",
          "Register an app at the provider with the callback URL of this instance, ending in /api/auth/oidc/callback. Enter the issuer URL, client ID, client secret, and scopes. Use Test connection before you save. GitHub has a preset.",
        ],
        [
          "Default roles",
          "Default roles are given to new users who sign in through this provider for the first time. Enter them separated by commas.",
        ],
        [
          "Telegram",
          "Telegram webhook calls are refused until a webhook secret token is set. Save a random value here with the bot enabled. Then register the webhook again with the same value.",
        ],
      ]
    ),
    withDetails(
      guide(
        "/settings/admin/tenants",
        "Tenant management",
        "Manage the current tenant, create tenants, and choose platform administrators.",
        "Tenant records and database capacity on this server. Only platform administrators can open this page.",
        "Edit changes the display name and active status of the current tenant. Create tenant requires a free slug and a display name. The platform administrators list grants or revokes that role for members of this tenant.",
        "Each tenant keeps its own patient data, settings, and members. Its slug is part of its address.",
        "The slug cannot change after you create the tenant. An inactive tenant is not available. Platform administrators can manage every tenant, which is different from a role inside one tenant.",
        ["/tenants", "/settings/admin", "/settings/access-requests"]
      ),
      [
        [
          "Multitenancy",
          "With multitenancy, each tenant has its own address, made from its slug and the base domain. When multitenancy starts, all app sessions are signed out. Configure apps and uploaders again with the new address.",
        ],
        [
          "Database capacity",
          "This shows the database size, the number of tenants, the average and largest tenant, and the used part of the storage budget.",
        ],
      ]
    ),
    guide(
      "/settings/admin/connector-cursors",
      "Reset Connector Cursors",
      "Ask a connector to read a chosen historical period again.",
      "Stored connector import watermarks and reset-job progress for the selected tenant.",
      "Platform administrators choose Tenant, connector, and optional Lower bound here, then monitor or cancel the job.",
      "A successful re-read fills or updates the normal imported histories, using normal duplicate protection.",
      "This does not delete source data. It may be useful when an already-completed month received data late. Refresh inventory only scans availability and is not a historical re-import.",
      ["/settings/connectors/google-health", "/settings/admin/tenants"]
    ),
    guide(
      "/settings/integrations/discord",
      "Discord Integration",
      "Link a Discord identity and manage its use with Nocturne.",
      "Your linked chat identities and server bot configuration.",
      "Link, label, select the default, or revoke an identity here. Follow the bot's server-install controls where available.",
      "The linked identity supports bot interactions authorized for your account.",
      "Bot availability depends on deployment configuration. Revoking a link does not delete patient data or messages already sent.",
      ["/settings/account"]
    ),
    guide(
      "/settings/access-requests",
      "Access requests",
      "Review people who requested an account on this instance.",
      "When access requests are allowed, a visitor can request access on the sign-in page with a name, a message, and a new passkey. The request waits here for a platform administrator.",
      "Choose roles, optional direct permissions, and the 24-hour limit for each request. Then select Approve or Deny.",
      "Approve activates the account and adds the person as a member of the tenant, with the chosen roles. Deny deactivates the requested account.",
      "A request grants nothing until you approve it. Membership requests from people who already have an account are reviewed in Sharing & privacy.",
      ["/settings/members", "/settings/admin/tenants"]
    ),
    guide(
      "/oauth/consent",
      "Authorize an app",
      "An app wants to read or change your Nocturne data. Approve only an app that you trust.",
      "The app supplies its name, address, and the permissions it requests. Nocturne warns you when the app is not in its known app directory.",
      "Read each permission and check the address that receives access. Optionally share only the last 24 hours. Then select Approve or Deny.",
      "An approved app gets access with these permissions. If the app later requests more, you see the new permissions separately from the ones you approved before.",
      "Full access includes deleting data. Deny gives the app nothing. Revoke an approved app later in Connectors & apps.",
      ["/settings/connectors", "/settings/access"]
    ),
    guide(
      "/oauth/device",
      "Link a device",
      "Approve a device that shows a code, such as an app on a TV or a command-line tool.",
      "The device shows a code in the form XXXX-YYYY when you start its sign-in.",
      "Enter the code and select Continue. Review the permissions, then select Approve or Deny.",
      "After you approve, the device gets access and you can close this window.",
      "A code expires. If the code expired, start the sign-in again on the device for a new code. Enter only a code that your own device shows.",
      ["/settings/connectors", "/settings/access"]
    ),
  ];
}
