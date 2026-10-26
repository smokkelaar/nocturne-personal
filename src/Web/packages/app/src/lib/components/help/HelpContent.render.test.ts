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
  it("renders help in the interface language from the catalogue", async () => {
    const body = await content("/settings/connectors/google-health", "nl");
    expect(body).toContain("verplicht bij de eerste keer");
    expect(body).toContain("Maak de webapplicatie-client aan");
  });
});
