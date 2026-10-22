import { beforeAll, describe, expect, it, vi } from "vitest";
import { render } from "svelte/server";
import Privacy from "./+page.svelte";

import { loadLocales, runWithLocale } from "wuchale/load-utils/server";
import * as main from "../../../../../../locales/main.loader.server.svelte.js";
import { locales } from "../../../../../../locales/data.js";

beforeAll(async () => {
  await loadLocales(main.key, main.loadCount, main.loadCatalog, locales);
});
const renderEnglish = (options: Parameters<typeof render<typeof Privacy>>[1]) =>
  runWithLocale("en", () => render(Privacy, options).body);

vi.mock("$app/paths", () => ({ resolve: (path: string) => path }));

describe("public instance privacy page", () => {
  it("renders operator text as text rather than executable HTML", async () => {
    const body = await renderEnglish({
      props: {
        data: {
          privacy: {
            published: true,
            appName: "Family Nocturne",
            operatorName: '<img src=x onerror="alert(1)">',
            contactEmail: "privacy@example.com",
            hosting: "<script>private()</script>",
            sharing: "Invited members only",
            retention: "Until deletion",
            backups: "Local private backups",
            effectiveDate: "2026-10-22",
          },
        } as never,
      },
    });
    expect(body).toContain("privacy@example.com");
    expect(body).toContain("&lt;img");
    expect(body).not.toContain("<img src=x");
    expect(body).not.toContain("<script>private()");
    expect(body).toContain("Limited Use");
    expect(body).toContain("Delete imported Google Health data");
    expect(body).toContain('href="https://github.com/smokkelaar/nocturne-personal"');
    expect(body).toContain('href="https://github.com/nightscout/nocturne"');
  });

  it("does not expose a contact address while publication is disabled", async () => {
    const body = await renderEnglish({
      props: {
        data: {
          privacy: {
            published: false,
            contactEmail: "do-not-publish@example.com",
          },
        } as never,
      },
    });
    expect(body).toContain("has not published");
    expect(body).not.toContain("do-not-publish@example.com");
  });
});
