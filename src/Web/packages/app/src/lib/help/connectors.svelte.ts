import { guide } from "./guide.svelte";
import type { HelpArticle } from "./documentation-types";

export function connectorArticles(): HelpArticle[] {
  const google = guide(
    "/settings/connectors/google-health",
    "Google Health",
    "Import steps, heart rate, sleep, and weight from Google Health. The person who runs this Nocturne server sets up one Google client once. Everyone else only checks their data in the Google Health app and selects Connect Google Health.",
    "Your device or source app sends data to Google Health. Nocturne reads the selected account through Google's API and stores supported records in this tenant's existing histories. A Google Cloud project provides permission to use the API. It does not generate health data.",
    "Connecting, the import selection, and Import data from are on Settings → Connectors & Apps → Google Health, per tenant. The Google client (Client ID, Client secret, Callback URL, Enabled) is on Settings → Administration → Integrations and only instance administrators can see it. When that card is not enabled, the connector page says your Nocturne operator did not enable Google Health. The reference panel below shows the callback path, requested read permissions, supported destinations, and default sync interval from this running version.",
    "Imported steps, heart rate, and sleep appear in their reports. Weight appears in Patient Record → Weight history. The supported-destinations table below follows the connector's actual capability catalog.",
    "The phone/watch must first sync to Google. Local Health Connect records do not guarantee availability in Google's cloud API. Inventory availability, Google sign-in, and import completion are separate states. Unsupported types can be visible but cannot be selected for import.",
    [
      "/reports/steps",
      "/reports/heart-rate",
      "/reports/sleep",
      "/settings/weight",
      "/settings/connectors",
    ],
    "google-health"
  );
  google.steps = [
    {
      title: "Install Google Health and check your data",
      text: "Install Google Health (formerly Fitbit) using the Play Store link below. Open it, sign in with the Google account you want to share, and complete its profile setup. Before continuing, make sure the steps, heart rate, sleep, or weight you want to share are visible in that app. Signing into Google alone is not enough.",
      links: [
        {
          title: "Install Google Health from the Play Store",
          href: "https://play.google.com/store/apps/details?id=com.fitbit.FitbitMobile&hl=en",
        },
      ],
    },
    {
      title: "Bring data from other apps into Google Health (optional)",
      text: "On Android use Health Connect, Google's on-device data-sharing service. Let your source app write the desired records and let Google Health read them. In Google Health open Connections → Partner apps → Sync your favorite health apps → Set up. Review the data, history, and background permissions, then check that records appear in Google Health. Garmin needs its watch to sync to Garmin Connect first. Google Health does not connect directly to the watch. Google also documents Samsung Galaxy, Xiaomi/Mi Fitness, Oura, Whoop, Strava, and MyFitnessPal connections. Available types differ by app: a direct Strava connection exports Google Health activities to Strava. Importing Strava activities uses Health Connect or Apple Health instead. Garmin Connect 5.14.1 or later writes steps, heart rate, sleep, and weight to Health Connect on Android 14 or later. On iPhone the Google Health app reads Apple Health itself: open Connections → Apps and services → Apple Health and allow the data. It reads about three months of history and needs iOS 16.4 or later. Garmin Connect, Apple Watch, and most iPhone apps write to Apple Health. Google Health supports more types than this Nocturne connector, so check the importable-type table below. Getting your data into Nocturne lists every route per kind of data.",
      links: [
        {
          title: "Install or open Health Connect",
          href: "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata&hl=en",
        },
        {
          title: "Google: set up Health Connect permissions and syncing",
          href: "https://support.google.com/googlehealth/answer/14506680",
        },
        {
          title: "Google: sync Google Health with Apple Health on iPhone",
          href: "https://support.google.com/googlehealth/answer/17037331",
        },
        {
          title: "Google: device and app connections, including Garmin",
          href: "https://support.google.com/googlehealth/answer/14236613?hl=en",
        },
      ],
    },
    {
      title: "Open Google's setup wizard",
      text: "Open the Google Setup documentation linked below. Select its blue button labeled Enable the API and get an OAuth 2.0 Client ID. Use a Google account that can manage your Cloud project. If Google restricts access for your project, resolve that eligibility before continuing. Leave Nocturne open in another tab.",
      links: [
        {
          title: "Open the Google Setup documentation",
          href: "https://developers.google.com/health/setup",
        },
      ],
    },
    {
      title: "Name your project and enable the API",
      text: "Choose a new project and enter a project name, or select an existing project you manage. The name is a reminder for you later: any recognisable name is fine. Select Next. Confirm that you want to enable the Google Health API and continue. This enables access to Google's service. It does not create or import any health records.",
    },
    {
      title: "Choose a product name",
      text: "Enter the product/application name requested by the wizard. You are free to choose it: it may match the project name or be completely different. It is the name shown on Google's consent screen when you connect from Nocturne. Complete any required contact details. Neither name needs to match your Nocturne hostname.",
    },
    {
      title: "Create the Web application client",
      text: "For Where are you calling from? select Web Server. In the manual Clients screen the equivalent type is Web application. Copy the complete Callback URL shown by this Nocturne instance under Settings → Administration → Integrations → Google Health into the wizard's redirect field (Authorized redirect URIs). Use your own instance's URL, including its scheme, hostname, port, and callback path exactly. Replace any sample redirect from Google's guide. Select Create. If the wizard's layout changes, the essential choices remain a web client and that exact redirect.",
    },
    {
      title: "Download the client configuration and enter it in Administration",
      text: "Download the Client configuration/Credentials JSON. An instance administrator opens Settings → Administration → Integrations and enters Client ID and Client secret on the Google Health card. The secret is required on first setup. Leave it empty only when keeping a secret that was already saved. Check the Callback URL, enable Enabled, and select Save. The change applies without a restart. Store the downloaded file privately: it contains credentials.",
    },
    {
      title: "Add the Google account as a test user",
      text: "Return to the Google Setup documentation, find Add test users, and open its Audience page link. Select the project you just configured. For a personal test use External with publishing status Testing. Under Test users choose Add users, enter the exact email address used in the Google Health app on your phone, and Save. Add each account that will share data. The account managing the Cloud project can be different from the account sharing health data.",
    },
    {
      title: "Check the read permissions in Data Access",
      text: "In Google's Data Access page choose Add or remove scopes, select the Google Health read scopes shown in Nocturne's reference table below, then Update and Save. Nocturne adds basic sign-in identification itself. These scopes govern which records it can read. They do not allow Nocturne to write to your Google Health account.",
    },
    {
      title: "Connect with the same account",
      text: "Open Settings → Connectors & Apps → Google Health and select Connect Google Health. Choose the Google Health account you added as a test user. Review and grant the read permissions for the data you want, and confirm you return to Nocturne. While the Google project is in Testing, Google ends this access after seven days. Then you connect again. See Google publishing and verification below.",
    },
    {
      title: "Review the inventory and start an import",
      text: "Choose Import data from for the history you want. In the available-data table, Found means records exist at the source, not that Nocturne imported them. Select supported types and choose Save selection and import. Save import settings only saves. Refresh inventory only checks availability. Not scanned needs a refreshed inventory. No permission needs the relevant consent. No destination yet is unsupported. Leaving the page does not cancel the server import.",
    },
    {
      title: "Confirm the result in your reports",
      text: "Watch sync status and Historical import progress. Open Steps, Heart Rate, or Sleep and choose dates containing source records. Use Weight history for weight. If empty, check the source account's visible records, granted permissions, import selection, dates, and last error. Google may still be syncing older phone records. Wait for that to finish before retrying. Completed historical months that receive records later need the recovery procedure below.",
    },
    {
      title: "Personalize branding (optional)",
      text: "After the connection works, open Branding in Google Auth Platform to adjust the app's display name, logo, and available contact or policy details. This changes how Google presents the app. It does not change your health data or Nocturne's import settings. Follow Google's validation requirements for any fields you add.",
    },
  ];
  google.sections.push(
    {
      title: "Ongoing sync and historical progress",
      text: "Automatic sync uses the default interval shown below unless your server changes it. While Import data from is empty, a new import covers the configured lookback, seven days by default. Managed imports resume recent data from a saved watermark with an overlap, then work backwards through older calendar months towards Import data from. Large or failing periods can be split into smaller windows. Progress describes stages and pages, not an exact remaining time. A restart resumes the saved cursor. Completed older months are not continually rescanned for data that Google uploads late.",
    },
    {
      title: "Data appeared in Google after an older month was completed",
      text: "First confirm that Google now contains the records. Refresh inventory checks availability but does not refill a completed month. Ask a platform administrator to use Import recovery → Open connector reset, select the correct tenant and earliest date to re-read, and monitor the job. The normal import path updates records with duplicate protection. Do not delete all data to solve an empty date range.",
    },
    {
      title: "Google publishing and verification",
      text: "Testing limits access to test users and expires refresh tokens after seven days. Publishing to Production removes that testing expiry. An unverified app still shows a warning and has a 100-user limit. Verification is a separate review. For more than 100 users, Google requires a third-party security assessment. Tokens can still expire or be revoked. Each user controls consent in their Google account. For a server shared by family or a few friends, publishing to Production and staying under 100 users is usually enough. Google sets these rules and can change them.",
      links: [
        {
          title: "Google: unverified apps and the 100-user limit",
          href: "https://support.google.com/cloud/answer/7454865",
        },
        {
          title: "Google: publishing status and refresh token expiry",
          href: "https://developers.google.com/identity/protocols/oauth2#expiration",
        },
      ],
    },
    {
      title: "Changing the Google client or account",
      text: "A connection belongs to the Google client it was made with. When an administrator replaces the Client ID, everyone who connected sees that this server's Google client has changed. They select Connect Google Health again. Imported data is kept. To move this tenant to a different Google account, disconnect and delete the imported Google Health data. Then connect the other account.",
    },
    {
      title: "Common setup errors",
      // @wc-include
      text: "redirect_uri_mismatch: copy the complete Nocturne Callback URL into the same OAuth client's redirect list. Access blocked or test-user errors: check Audience, exact email, enabled API, and current Google access eligibility. ACCOUNT_NOT_LINKED: complete the Google Health app profile with this account. Missing permission: sign in again and grant the required read access. An expired test grant: reconnect. Production verification and quota rules belong to Google and can change.",
    },
    {
      title: "Pause, disconnect, and deletion",
      text: "Clear selected types and Save import settings to pause imports without deleting history. Disconnect stops syncing, keeps imported records, and revokes Nocturne's access in Google. If another tenant on this server is still connected to the same Google account, that access is kept so the other tenant keeps syncing. If Google could not be reached, Nocturne asks you to revoke the app in your Google account yourself. Delete imported data is a separate confirmed action available after disconnecting. It affects this tenant's imported records, not Google's originals. The client secret is stored encrypted in the instance settings. Never paste the secret or token into support conversations.",
    }
  );
  google.sources = [
    {
      title: "Google: API setup, access availability, and account linking",
      href: "https://developers.google.com/health/setup",
    },
    {
      title: "Google: connect Health Connect to Google Health",
      href: "https://support.google.com/googlehealth/answer/14506680",
    },
    {
      title: "Google: Web application OAuth and exact redirects",
      href: "https://developers.google.com/identity/protocols/oauth2/web-server",
    },
    {
      title: "Google: API data types and availability",
      href: "https://developers.google.com/health/data-types",
    },
  ];
  const connector = (
    id: string,
    title: string,
    introduction: string,
    source: string,
    fields: string,
    data: string,
    details: string
  ) => ({
    ...guide(
      `/settings/connectors/${id}`,
      title,
      introduction,
      source,
      `${fields} Select Enable connector to start the scheduled sync. Sync capabilities lists the supported data types and whether Historical sync and Manual sync are available. The form's validation is authoritative for this version.`,
      `${data} Imported records appear on the dashboard and in the reports and histories for their type.`,
      `${details} A saved configuration is not proof an import succeeded: check the connection status and the latest sync. Administrators can use Fill in missing history to download again from a chosen day. Records you already have are matched, so it does not duplicate them. Danger zone deletes this connector's synced data or its configuration. Keep credentials private.`,
      ["/settings/connectors"]
    ),
    visual: "flow" as const,
    settings: ["/settings/connectors"],
    reading: [
      { title: "Check the source", text: source },
      { title: "Complete this connector's form", text: fields },
      { title: "Verify the imported records", text: details },
    ],
  });
  return [
    google,
    connector(
      "dexcom",
      "Dexcom",
      "Import CGM readings from a Dexcom Share account.",
      "Nocturne reads glucose from Dexcom's Share service, the same service Dexcom Follow uses. Your Dexcom app or receiver must upload with Share turned on.",
      "Enter the Username and Password of the Dexcom account that uploads the readings. Choose Server US for an American account and EU for an account outside the US.",
      "Glucose readings only. Treatments, calibrations, and device settings are not imported from Dexcom.",
      "Historical sync reaches up to 90 days back. If no readings arrive, check that Share is on in the Dexcom app and that the phone has a connection. A wrong server region looks like a failed sign-in."
    ),
    connector(
      "librelinkup",
      "FreeStyle Libre",
      "Import CGM readings shared through LibreLinkUp.",
      "Nocturne signs in to LibreLinkUp as a follower and reads the glucose of the person who shares with that account. Sharing must already be active in the LibreLink or Libre app.",
      "Enter the Username and Password of the LibreLinkUp account that follows the patient, and choose the Region of that account. If the account follows more than one person, enter the Patient ID of the one to import.",
      "Glucose readings and sensor device events.",
      "LibreLinkUp only offers recent readings, so this connector cannot import older history. Open the LibreLinkUp app once to accept new terms when sign-in stops working. Readings stored only on the sensor or phone and not yet uploaded are not available."
    ),
    connector(
      "carelink",
      "Medtronic CareLink",
      "Import pump and CGM data from a Medtronic CareLink account.",
      "Nocturne reads the live data your pump or MiniMed app uploads to CareLink.",
      "Choose the region, EU / outside-US or US, and select Connect CareLink. Sign in to CareLink in the tab that opens. Your password is never sent to Nocturne: it stores only a revocable refresh token. In a normal browser you copy the redirect link from the developer tools Network tab and paste it in Finish connecting. The Nocturne desktop app captures that code for you after Generate link code. For a follower account, set the Patient ID.",
      "Glucose, device status, boluses, carb intake, temp basals, state spans such as pump modes, and device events.",
      "CareLink offers no historical sync, so Nocturne imports from the moment you connect onwards. Select Reconnect when the refresh token stops working. Data arrives only while the pump or app keeps uploading to CareLink."
    ),
    connector(
      "glooko",
      "Glooko",
      "Import pump, pen, meter, and CGM data from a Glooko account.",
      "Nocturne reads the data your devices and apps upload to Glooko.",
      "Enter the Email and Password of the Glooko account and choose its Server region: US, EU, or CA. Lookback days (10 by default, up to 60) sets how far back each sync reaches. Use V3 API is on by default. Include CGM backfill adds historical CGM data on the V3 API. Use Granular Sync (Experimental) reads each kind of data from its own feed and also imports pen injections, app-logged doses, and extended boluses. Automatic clock correction lets device-clock evidence correct imported timestamps.",
      "Glucose, meter readings, boluses, basal injections, carb intake, food, temp basals, state spans, device events, profiles, notes, and activity.",
      "Glooko only has what your devices have uploaded, and uploads can lag hours behind. A device with a wrong clock shifts its records. Automatic clock correction can fix that from the evidence in the account."
    ),
    connector(
      "gluroo",
      "Gluroo",
      "Import glucose, treatments, and profiles from Gluroo Global Connect.",
      "Gluroo Global Connect offers a Nightscout-compatible address for your Gluroo data. Nocturne reads it the same way as a Nightscout site.",
      "Enter the URL and API secret of your Global Connect address from the Gluroo app. Max count limits the number of records per request.",
      "Glucose, meter readings, boluses, carb intake, notes, and profiles.",
      "Historical sync reaches up to 90 days back. Records must reach Gluroo first. Check the Global Connect settings in Gluroo when the sign-in is refused."
    ),
    connector(
      "nightscout",
      "Nightscout",
      "Keep importing from an existing Nightscout site.",
      "Nocturne reads the records of the Nightscout site you configure through its API, and can follow live updates.",
      "Enter the site URL and its API secret. Realtime URL is only needed when the data URL is an adapter and live updates come from another Nightscout origin. Max count sets the number of records per request. Enable write-back also writes records made in Nocturne back to the Nightscout site, in batches of the chosen size.",
      "Glucose, meter readings, boluses, carb intake, bolus calculations, notes, device events, profiles, device status, food, and activity.",
      "Historical sync reaches up to 365 days back. For a one-off move of all history use Data Migration instead, which also reads MongoDB directly. Write-back changes the source site, so turn it on only when that is what you want."
    ),
    connector(
      "nocturneremote",
      "Nocturne Remote",
      "Import data from another Nocturne server.",
      "Nocturne reads the records that an access token on the remote Nocturne server can see.",
      "Enter the URL of the remote tenant and an Access token created there. Max count (500 by default) sets the number of records per request.",
      "Glucose, meter readings, boluses, carb intake, bolus calculations, notes, device events, state spans, profiles, device status, activity, and food.",
      "Historical sync has no day limit. The token decides what the connector can read: a token with fewer permissions or a 24-hour history limit imports less. Settings, members, and alert rules are not copied."
    ),
    connector(
      "tandem",
      "Tandem Source",
      "Import t:slim X2 and Mobi pump data from Tandem Source.",
      "Nocturne reads the pump history that the t:slim or Mobi app uploads to Tandem Source.",
      "Enter the Email and Password of the Tandem Source account and choose Region US or EU. When the account has more than one pump, enter the Pump serial number to follow. Fetch all event types reads every pump history event instead of the default set. Ignore zero-unit basal skips basal entries with a near-zero rate.",
      "Glucose, boluses, carb intake, bolus calculations, temp basals, device events such as alarms, state spans, device status, and profiles.",
      "Tandem Source updates only after the pump app uploads, so recent data can be hours old. Scheduled basal from profiles is not proof of actual delivery."
    ),
    connector(
      "tidepool",
      "Tidepool",
      "Import glucose and treatments from a Tidepool account.",
      "Nocturne reads the device data uploaded to Tidepool.",
      "Enter the Username and Password of the Tidepool account and keep Server on US. Leave User ID empty to read the signed-in account. Enter one only to read another account this sign-in can access.",
      "Glucose, boluses, and carb intake.",
      "Historical sync reaches up to 365 days back. Data appears only after a device upload to Tidepool."
    ),
    connector(
      "twiist",
      "Twiist Insight",
      "Import data from Twiist Insight with a follower account.",
      "Nocturne uses the Twiist Insight follower service to read the shared data.",
      "Enter the Username and Password of the follower account.",
      "Glucose, boluses, carb intake, and temp basals.",
      "This connector offers no historical sync. It imports from the moment you connect onwards. Data arrives only while the pump app keeps uploading."
    ),
    connector(
      "eversense",
      "Eversense",
      "Import CGM readings from Eversense Now.",
      "Nocturne reads glucose from the Eversense Now sharing service.",
      "Enter the Username and Password of the Eversense account and choose Server US or OUS for an account outside the US. When the account follows more than one person, enter the Patient username to import.",
      "Glucose readings only.",
      "Historical sync reaches up to 30 days back. Readings must be uploaded by the Eversense app before they can be imported."
    ),
    connector(
      "mylife",
      "myLife",
      "Import pump data from mylife Cloud.",
      "Nocturne reads the data that the mylife app uploads from your YpsoPump to mylife Cloud.",
      "Enter the Username and Password of the mylife account. Patient ID and Service URL are only needed for a follower account or another endpoint. Consolidate meal carbs combines carb entries of the same meal. Consolidate temp basals combines consecutive temporary basal segments within the chosen window, 5 minutes by default.",
      "Glucose, meter readings, boluses, carb intake, bolus calculations, notes, device events, state spans, and profiles.",
      "Data appears only after the mylife app has uploaded it. Disable consolidation when you need every separate record from the source."
    ),
    connector(
      "myfitnesspal",
      "MyFitnessPal",
      "Import your MyFitnessPal food diary for meal matching.",
      "Nocturne reads the food diary of the MyFitnessPal account you sign in with.",
      "Enter the Username and Password, or a Refresh token. Lookback days (7 by default, up to 365) sets how far back each sync reads the diary.",
      "Food diary entries. They are used on Meals to match foods with carb treatments.",
      "This is not a glucose connection. A diary entry is not a carb treatment: record the carbs through your loop or Meals."
    ),
    {
      ...guide(
        "/settings/connectors/homeassistant",
        "Home Assistant",
        "Show Nocturne data in Home Assistant with the Nocturne integration.",
        "The Nocturne integration in Home Assistant reads from this Nocturne server. Data goes from Nocturne to Home Assistant, not the other way round.",
        "Follow the Setup guide on this page. Install HACS and add the Nocturne Home Assistant repository under Custom repositories as an Integration. Install Nocturne and restart Home Assistant. Then go to Settings → Devices & Services → Add Integration and choose Nocturne. Enter your Nocturne URL and complete the authorization.",
        "Home Assistant creates sensors for the data that is available, such as the latest glucose, for use in dashboards and automations.",
        "This integration is separate from running the Nocturne server itself as a Home Assistant app. The authorization appears under Connectors & Apps → Connected apps, where you can revoke it. Sensors show only what the authorization can read.",
        ["/settings/connectors"]
      ),
      visual: "flow" as const,
      settings: ["/settings/connectors"],
      reading: [
        {
          title: "Check the direction",
          text: "Home Assistant reads from Nocturne. Nothing is imported into Nocturne.",
        },
        {
          title: "Install the integration",
          text: "Use HACS to install the Nocturne integration, then add it under Devices & Services.",
        },
        {
          title: "Verify the sensors",
          text: "Check that Home Assistant shows the Nocturne sensors and that Connected apps lists the authorization.",
        },
      ],
    },
  ];
}
