import { beforeAll, describe, expect, it } from "vitest";
import { render } from "svelte/server";
import Harness from "./HelpContentHarness.test.svelte";
import { loadLocales, runWithLocale } from "wuchale/load-utils/server";
import * as main from "../../../../../../locales/main.loader.server.svelte.js";
import { locales } from "../../../../../../locales/data.js";
import { chartLessons } from "$lib/help/chart-lessons.svelte";

beforeAll(async () => {
  await loadLocales(main.key, main.loadCount, main.loadCatalog, locales);
});
const content = (path: string, locale = "en") =>
  runWithLocale(locale, () => render(Harness, { props: { path } }).body);

describe("translation-aware help factories", () => {
  it("translates interactive chart lessons without leaking implementation names", async () => {
    const lessons = await runWithLocale("nl", () => chartLessons());
    expect(lessons.median.title).toBe("Mediaan en spreiding");
    expect(lessons.prediction.meaning).toContain("voorspelhorizon");
    expect(lessons.barComparison.meaning).toContain("omlijningen");
    expect(lessons.schedule.check).toContain("afgifteregistraties");
  });
  it("renders the new report guides instead of the generic parent guide", async () => {
    for (const [path, title] of [
      ["/reports/loop-analysis/daily-profile", "Daily profile"],
      ["/reports/loop-analysis/meals-and-events", "Meals and events"],
      ["/reports/loop-analysis/prediction-accuracy", "Prediction accuracy"],
      ["/reports/loop-analysis/loop-health", "Loop health"],
      ["/reports/loop-analysis/settings-evidence", "Settings evidence"],
      ["/reports/data-quality/rejected-uploads", "Rejected uploads"],
    ]) {
      const body = await content(path);
      expect(body).toContain(title);
      expect(body).toContain("How to read this page");
    }
  });
  it("renders Dutch setup guidance through the production transform", async () => {
    const setup = await content("/help/getting-started", "nl");
    expect(setup).toContain("Snel starten");
    expect(setup).toContain("Koppelingen en apps");
  });
  it("renders dashboard explanations and page meanings in the interface language", async () => {
    const body = await content("/", "nl");
    expect(body).toContain("Auto telt de algoritmebolussen op");
    expect(body).toContain("De grote waarde is de nieuwste sensormeting");
    const calendar = await content("/calendar", "nl");
    expect(calendar).toContain("De kleuren van een dag");
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
