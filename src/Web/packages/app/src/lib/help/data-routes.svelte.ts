import { DATA_ROUTES_PATH } from "./reference-path";
import type { HelpArticle } from "./documentation-types";

export function dataRoutesArticle(): HelpArticle {
  return {
    href: DATA_ROUTES_PATH,
    title: "Getting your data into Nocturne",
    introduction:
      "Find the kind of data you collect and see every way it can reach Nocturne, from your device to this server. Open only the blocks you need.",
    helpOnly: true,
    visual: "flow",
    settings: ["/settings/connectors"],
    related: [
      "/settings/connectors",
      "/settings/connectors/google-health",
      "/settings/connectors/glooko",
    ],
    sections: [
      {
        id: "controls",
        title: "How to choose a route",
        text: "There are three kinds of route. A server connector signs in to a cloud service and pulls your data, so nothing has to run on your phone. An uploader app on your phone sends data straight to Nocturne as it arrives. A health platform such as Google Health, Health Connect, or Apple Health collects data from many apps first. Pick one route per kind of data: two routes for the same data can import it twice. Server connectors and uploader apps are both under Settings → Connectors & Apps.",
      },
      {
        title: "Glucose from a CGM",
        text: "Glucose has the most routes. The quickest is usually the cloud service of your sensor.",
        routes: [
          {
            title: "Server connector for your sensor",
            text: "Dexcom (Share), FreeStyle Libre (LibreLinkUp), Eversense (Eversense Now), and Medtronic CareLink. You only enter the account details. Libre and CareLink offer recent data only, so older history stays behind.",
          },
          {
            title: "Uploader app on your phone",
            text: "xDrip+, Juggluco, and GlucoTracker on Android, xDrip4iOS and Spike on iPhone, or a loop app (AAPS, Loop, Trio, iAPS). Open Add an uploader, choose the app, and follow its instructions: enter the Nocturne URL and API key it shows, or scan the code, depending on the app.",
          },
          {
            title: "Through another platform",
            text: "If your data already goes to Nightscout, Glooko, Tidepool, Gluroo, Tandem Source, mylife, or Twiist Insight, connect that service instead.",
          },
          {
            title: "Not possible yet",
            text: "Glucose stored in Apple Health or Health Connect does not reach Nocturne through Google Health. The Google Health connector can see it but does not import it yet.",
          },
        ],
      },
      {
        title: "Insulin, carbs, and pump data",
        text: "Treatments come from the app or pump that records them.",
        routes: [
          {
            title: "Loop app",
            text: "AAPS, Loop, Trio, iAPS, and OpenAPS upload boluses, carbs, temp basals, profiles, and loop status as an uploader.",
          },
          {
            title: "Pump cloud",
            text: "Medtronic CareLink, Tandem Source (t:slim X2 and Mobi), mylife (YpsoPump), and Twiist Insight each have a server connector.",
          },
          {
            title: "Pens and mixed devices",
            text: "Glooko imports pump, pen, and meter data. Enable Use Granular Sync (Experimental) to also import pen injections and app-logged doses.",
          },
          {
            title: "Existing Nightscout or Nocturne",
            text: "The Nightscout and Nocturne Remote connectors keep importing from a server you already use. Data Migration moves a whole Nightscout history once.",
          },
        ],
      },
      {
        title: "Food and meals",
        text: "Food records give context to carbs and meals.",
        routes: [
          {
            title: "MyFitnessPal",
            text: "The MyFitnessPal connector imports your food diary, which Meals can match with carb entries.",
          },
          {
            title: "Glooko, Nightscout, or Nocturne Remote",
            text: "These connectors import the food records of that service.",
          },
          {
            title: "In Nocturne",
            text: "Add foods yourself on the Food page.",
          },
        ],
      },
      {
        title: "Steps",
        text: "Most step routes end in Google Health, which the Google Health connector reads. Check that the steps are visible in the Google Health app before connecting.",
        routes: [
          {
            title: "Fitbit or Pixel Watch",
            text: "Already in Google Health. Connect Google Health in Nocturne and select Steps.",
          },
          {
            title: "Garmin on Android",
            text: "Garmin Connect writes steps, heart rate, sleep, and weight to Health Connect (Garmin Connect 5.14.1 or later, Android 14 or later). In the Google Health app enable Health Connect syncing so it reads them. Your watch has to sync to Garmin Connect first.",
          },
          {
            title: "Samsung, Oura, Withings, and other Android apps",
            text: "Let the app write to Health Connect and let Google Health read Health Connect. Then connect Google Health in Nocturne.",
          },
          {
            // @wc-include
            title: "iPhone, Apple Watch, or Garmin on iPhone",
            text: "Garmin Connect and most iPhone apps write to Apple Health. In the Google Health app open Connections → Apps and services → Apple Health and allow the data. Google Health reads about three months of Apple Health history and needs iOS 16.4 or later. Then connect Google Health in Nocturne.",
          },
          {
            // @wc-include
            title: "iPhone through Glooko",
            text: "The Glooko app can read daily step totals from Apple Health. The Glooko connector imports them with Use Granular Sync (Experimental) and Sync activity turned on.",
          },
          {
            title: "xDrip+",
            // @wc-include
            text: "xDrip+ can upload steps from the phone or a supported watch with its other data. Nocturne stores them as step counts.",
          },
          {
            title: "Your own script or automation",
            text: "Send steps to /api/v4/stepcount with an API token that has the stepcount.readwrite permission. Create tokens under Connectors & Apps.",
          },
        ],
      },
      {
        title: "Heart rate",
        text: "Heart rate takes the same routes as steps.",
        routes: [
          {
            title: "Google Health",
            text: "Fitbit and Pixel Watch directly, Garmin and Samsung through Health Connect, Apple Watch and Garmin on iPhone through Apple Health.",
          },
          {
            title: "Glooko",
            text: "With Use Granular Sync (Experimental) and Sync activity on, Glooko delivers resting heart rate when the account has it.",
          },
          {
            // @wc-include
            title: "xDrip+ or your own script",
            text: "xDrip+ uploads heart rate from supported watches and bands. Scripts can send it to /api/v4/heartrate with the heartrate.readwrite permission.",
          },
        ],
      },
      {
        title: "Sleep",
        text: "Sleep sessions and stages come from Google Health.",
        routes: [
          {
            title: "Google Health",
            text: "Fitbit and Pixel Watch directly. Garmin, Samsung, and Oura through Health Connect. Apple Watch and other iPhone apps through Apple Health. Sleep stages appear only when the source records them.",
          },
        ],
      },
      {
        title: "Weight",
        text: "Weights are listed in Patient Record → Weight history.",
        routes: [
          {
            title: "Smart scale through Google Health",
            text: "Fitbit scales directly, and Withings or other scales through Health Connect or Apple Health.",
          },
          {
            title: "Glooko",
            text: "Glooko delivers weights from Apple Health, Garmin, and Withings with Use Granular Sync (Experimental) and Sync activity on.",
          },
          {
            title: "By hand",
            text: "Choose Add an entry in Weight history.",
          },
        ],
      },
    ],
    sources: [
      {
        title: "Google: sync Google Health with Apple Health",
        href: "https://support.google.com/googlehealth/answer/17037331",
      },
      {
        title: "Google: set up Health Connect permissions and syncing",
        href: "https://support.google.com/googlehealth/answer/14506680",
      },
      {
        title: "Glooko: fitness and health data you can sync",
        href: "https://support.glooko.com/hc/en-us/articles/115003858589-What-third-party-fitness-and-health-data-can-I-sync-with-my-Glooko-account",
      },
    ],
  };
}
