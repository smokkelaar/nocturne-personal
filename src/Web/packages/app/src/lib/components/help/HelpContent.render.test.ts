import { beforeAll, describe, expect, it } from "vitest";
import { render } from "svelte/server";
import Harness from "./HelpContentHarness.test.svelte";
import { loadLocales, runWithLocale } from "wuchale/load-utils/server";
import * as main from "../../../../../../locales/main.loader.server.svelte.js";
import { locales } from "../../../../../../locales/data.js";

beforeAll(async () => {
  await loadLocales(main.key, main.loadCount, main.loadCatalog, locales);
});
const content = (path: string, locale = "en") =>
  runWithLocale(locale, () => render(Harness, { props: { path } }).body);

describe("translation-aware help factories", () => {
  it("renders the new report guides instead of the generic parent guide", async () => {
    for (const [path, title] of [
      ["/reports/loop-analysis/daily-profile", "Daily Profile"],
      ["/reports/loop-analysis/meals-and-events", "Meals and Events"],
      ["/reports/loop-analysis/prediction-accuracy", "Prediction Accuracy"],
      ["/reports/loop-analysis/loop-health", "Loop Health"],
      ["/reports/loop-analysis/settings-evidence", "Settings Evidence"],
      ["/reports/data-quality/rejected-uploads", "Rejected Uploads"],
    ]) {
      const body = await content(path);
      expect(body).toContain(title);
      expect(body).toContain("How to read this page");
    }
  });
  it("renders the Dutch daily profile help through the production transform", async () => {
    const body = await content("/reports/loop-analysis/daily-profile", "nl");
    expect(body).toContain("Dagprofiel");
    expect(body).toContain("Kies een periode");
  });
  it("renders Dutch setup and rejection guidance without losing the diagnostic limits", async () => {
    const setup = await content("/help/getting-started", "nl");
    expect(setup).toContain("Snel starten");
    expect(setup).toContain("Koppelingen en apps");
    const rejected = await content(
      "/reports/data-quality/rejected-uploads",
      "nl"
    );
    expect(rejected).toContain("Afgewezen uploads");
    expect(rejected).toContain("voert uploads niet opnieuw uit");
    expect(rejected).toContain("herleidbare gezondheidsgegevens");
  });
  it("falls back to English for untranslated dashboard explanations", async () => {
    const body = await content("/", "nl");
    expect(body).toContain("Auto totals algorithm bolus records");
    expect(body).toContain("The large value is the newest sensor measurement");
  });
  it("renders report content through the production translation transform", async () => {
    const body = await content("/reports/agp");
    expect(body).toContain("Ambulatory Glucose Profile");
    expect(body).toContain("Where the information comes from");
    expect(body).toContain("percentile");
    expect(body).toContain("Find the middle line");
    expect(body).toContain("How to read this page");
  });
  it("keeps English Google setup steps available through the transform", async () => {
    const body = await content("/settings/connectors/google-health");
    expect(body).toContain("Create the Web application client");
    expect(body).toContain("Save selection and import");
    expect(body).toContain("required on first setup");
  });
  it("has readable English help fallbacks in another interface language", async () => {
    const body = await content("/settings/connectors/google-health", "nl");
    expect(body).toContain("required on first setup");
    expect(body).toContain("Create the Web application client");
  });
});
