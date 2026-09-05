import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";
import type { DailySummaryDay } from "$api/generated/nocturne-api-client";
import { yearOverviewMocks } from "$lib/test-stubs/year-overview-remote";
import { page as applicationPage } from "$lib/test-stubs/year-overview-runtime.svelte";
import { getGlucoseHeatmapFill } from "$lib/utils/chart-colors";
import YearOverviewPage from "./+page.svelte";

const storageKey = (user = "synthetic-user") =>
  `nocturne-year-color-focus-v1:${JSON.stringify(["synthetic-tenant", user])}`;
const minimum = (metric = "TDD") =>
  page.getByRole("spinbutton", { name: `${metric} minimum color value` });
const maximum = (metric = "TDD") =>
  page.getByRole("spinbutton", { name: `${metric} maximum color value` });
const cell = (day: string) => page.getByTestId(`cell-${day}`);
const observedYears = new Map<number, () => void>();

function day(date: string, dose: number | null): DailySummaryDay {
  return {
    date,
    averageGlucoseMgdl: 120,
    totalCount: 1,
    counts: { Glucose: 1 },
    totalDailyDose: dose,
    totalBolusUnits: dose,
    timeInRangePercent: 75,
  };
}

async function selectMetric(name: string) {
  await page
    .getByRole("button", {
      name: /^(Avg Glucose|Time in Range|Bolus|Basal|TDD|Carbs)$/,
    })
    .click();
  await page.getByRole("option", { name, exact: true }).click();
}

async function setRange(min: number, max: number, metric = "TDD") {
  await minimum(metric).fill(String(min));
  await maximum(metric).fill(String(max));
}

describe("year overview page color focus integration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.localStorage.clear();
    applicationPage.data.user.subjectId = "synthetic-user";
    observedYears.clear();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        private observed = new Map<number, () => void>();
        constructor(private callback: IntersectionObserverCallback) {}
        observe(target: HTMLElement) {
          const year = Number(target.dataset.year);
          const intersect = () => {
            this.callback(
              [{ target, isIntersecting: true } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver
            );
          };
          this.observed.set(year, intersect);
          observedYears.set(year, intersect);
        }
        disconnect() {
          for (const [year, callback] of this.observed) {
            if (observedYears.get(year) === callback)
              observedYears.delete(year);
          }
          this.observed.clear();
        }
      }
    );
    yearOverviewMocks.years.mockResolvedValue({
      years: [2026],
      availableDataSources: [],
    });
    yearOverviewMocks.days.mockResolvedValue({
      days: [
        day("2026-01-01", 20),
        day("2026-01-02", 40),
        day("2026-01-03", 60),
        day("2026-01-04", 500),
      ],
    });
    yearOverviewMocks.gri.mockResolvedValue({ periods: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("remembers independent metric limits across switches and a page remount", async () => {
    const screen = render(YearOverviewPage);
    await expect.element(cell("2026-01-04")).toBeInTheDocument();
    await selectMetric("TDD");
    await setRange(10, 70);
    await expect
      .element(cell("2026-01-02"))
      .toHaveTextContent("var(--chart-4) 58%");

    await selectMetric("Bolus");
    await setRange(2, 25, "Bolus");
    await selectMetric("TDD");
    await expect.element(minimum()).toHaveValue(10);
    await expect.element(maximum()).toHaveValue(70);
    expect(JSON.parse(window.localStorage.getItem(storageKey())!)).toEqual({
      tdd: [10, 70],
      bolus: [2, 25],
    });

    await screen.unmount();
    render(YearOverviewPage);
    await selectMetric("TDD");
    await expect.element(minimum()).toHaveValue(10);
    await expect.element(maximum()).toHaveValue(70);
    await selectMetric("Bolus");
    await expect.element(minimum("Bolus")).toHaveValue(2);
    await expect.element(maximum("Bolus")).toHaveValue(25);
    await page
      .getByRole("button", { name: "Reset Bolus color range to automatic" })
      .click();
    expect(JSON.parse(window.localStorage.getItem(storageKey())!)).toEqual({
      tdd: [10, 70],
    });
  });

  it("keeps a saved manual focus when lazy loading introduces a larger outlier", async () => {
    window.localStorage.setItem(
      storageKey(),
      JSON.stringify({ tdd: [10, 70] })
    );
    yearOverviewMocks.years.mockResolvedValue({
      years: [2026, 2025],
      availableDataSources: [],
    });
    const olderYear = Promise.withResolvers<{ days: DailySummaryDay[] }>();
    yearOverviewMocks.days.mockImplementation(({ year }) =>
      year === 2026
        ? Promise.resolve({
            days: [day("2026-01-01", 40), day("2026-01-02", 70)],
          })
        : olderYear.promise
    );
    render(YearOverviewPage);
    await expect.element(cell("2026-01-01")).toBeInTheDocument();
    await selectMetric("TDD");
    await expect
      .element(cell("2026-01-01"))
      .toHaveTextContent("var(--chart-4) 58%");
    await vi.waitFor(() => expect(observedYears.has(2025)).toBe(true));
    observedYears.get(2025)!();
    await vi.waitFor(() =>
      expect(yearOverviewMocks.days).toHaveBeenCalledWith({ year: 2025 })
    );
    olderYear.resolve({ days: [day("2025-01-01", 1000)] });
    await expect
      .element(cell("2025-01-01"))
      .toHaveTextContent("var(--chart-4) 100%");
    await expect
      .element(cell("2026-01-01"))
      .toHaveTextContent("var(--chart-4) 58%");
    await expect.element(minimum()).toHaveValue(10);
    await expect.element(maximum()).toHaveValue(70);
    await expect
      .element(page.getByRole("slider", { name: "TDD maximum color value" }))
      .toHaveAttribute("aria-valuemax", "1000");

    await page
      .getByRole("button", { name: "Reset TDD color range to automatic" })
      .click();
    await expect.element(maximum()).toHaveValue(1000);
    await expect
      .element(cell("2026-01-01"))
      .toHaveTextContent("var(--chart-4) 18%");
  });

  it("saturates outliers without treating missing readings as zero or changing glucose colors", async () => {
    yearOverviewMocks.days.mockResolvedValue({
      days: [
        day("2026-01-01", null),
        day("2026-01-02", 0),
        day("2026-01-03", 10),
        day("2026-01-04", 70),
        day("2026-01-05", 500),
      ],
    });
    render(YearOverviewPage);
    await expect
      .element(cell("2026-01-01"))
      .toHaveTextContent(getGlucoseHeatmapFill(120));
    await expect.element(page.getByRole("slider")).not.toBeInTheDocument();
    await expect
      .element(page.getByRole("img", { name: "Glucose color scale legend" }))
      .toBeVisible();
    await selectMetric("TDD");
    await setRange(10, 70);
    await expect.element(cell("2026-01-01")).toHaveTextContent("var(--muted)");
    await expect
      .element(cell("2026-01-02"))
      .toHaveTextContent("var(--chart-4) 15%");
    await expect
      .element(cell("2026-01-03"))
      .toHaveTextContent("var(--chart-4) 15%");
    await expect
      .element(cell("2026-01-04"))
      .toHaveTextContent("var(--chart-4) 100%");
    await expect
      .element(cell("2026-01-05"))
      .toHaveTextContent("var(--chart-4) 100%");

    await selectMetric("Avg Glucose");
    await expect.element(page.getByRole("slider")).not.toBeInTheDocument();
    await expect
      .element(cell("2026-01-01"))
      .toHaveTextContent(getGlucoseHeatmapFill(120));
  });

  it("keeps the control usable and reports when browser storage cannot save", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    render(YearOverviewPage);
    await expect.element(cell("2026-01-02")).toBeInTheDocument();
    await selectMetric("TDD");
    await setRange(10, 70);
    await expect
      .element(page.getByRole("status"))
      .toHaveTextContent("This browser could not save the color range");
    await expect
      .element(cell("2026-01-02"))
      .toHaveTextContent("var(--chart-4) 58%");
    await selectMetric("Bolus");
    await selectMetric("TDD");
    await expect.element(minimum()).toHaveValue(10);
    await expect.element(maximum()).toHaveValue(70);
  });

  it("does not restore another user's saved focus on the same browser", async () => {
    window.localStorage.setItem(
      storageKey(),
      JSON.stringify({ tdd: [10, 70] })
    );
    applicationPage.data.user.subjectId = "another-synthetic-user";
    render(YearOverviewPage);
    await expect.element(cell("2026-01-04")).toBeInTheDocument();
    await selectMetric("TDD");
    await expect.element(minimum()).toHaveValue(0);
    await expect.element(maximum()).toHaveValue(500);
    await setRange(20, 60);
    expect(
      JSON.parse(
        window.localStorage.getItem(storageKey("another-synthetic-user"))!
      )
    ).toEqual({ tdd: [20, 60] });
    expect(JSON.parse(window.localStorage.getItem(storageKey())!)).toEqual({
      tdd: [10, 70],
    });
  });
});
