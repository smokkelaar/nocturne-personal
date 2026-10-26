import { render } from "vitest-browser-svelte";
import { page, userEvent } from "vitest/browser";
import { afterEach, describe, expect, it, vi } from "vitest";
import { glucoseUnits } from "$lib/stores/appearance-store.svelte";
import { goto } from "$app/navigation";
import Harness from "./ChartExampleHarness.test.svelte";

vi.mock("$app/navigation", () => ({ goto: vi.fn() }));
const originalUnits = glucoseUnits.current;
afterEach(() => {
  glucoseUnits.current = originalUnits;
  vi.clearAllMocks();
});
const button = (name: string) =>
  page.getByRole("button", { name, exact: true });
const slider = () => page.getByRole("slider");
const focusChart = () => {
  (slider().element() as HTMLElement).focus();
};

describe("interactive report help", () => {
  it("lazy-loads the matching chart through the page reading aid", async () => {
    render(Harness, { path: "/reports/loop-analysis/daily-profile" });
    await expect
      .element(page.getByRole("region", { name: "Interactive chart example" }))
      .toBeVisible();
    await expect
      .element(slider())
      .toHaveAttribute("aria-label", "Median and spread");
  });
  it("explains an actual gap and preserves a keyboard selection", async () => {
    render(Harness);
    await button("Missing data").click();
    focusChart();
    for (let i = 0; i < 3; i++) await userEvent.keyboard("{ArrowRight}");
    await expect
      .element(slider())
      .toHaveAttribute(
        "aria-valuetext",
        expect.stringContaining("No data in this example slot")
      );
    await userEvent.keyboard("{Enter}");
    await expect
      .element(page.getByRole("status"))
      .toHaveTextContent("09:00\u201312:00: No data in this example slot");
    const plot = document.querySelector('[data-example-chart="bands"]')!;
    expect(
      plot.querySelectorAll(
        'path[fill="' + "oklch(from var(--chart-1) l c h / 0.35)" + '"]'
      )
    ).toHaveLength(2);
    await button("Comparison period").click();
    expect(plot.querySelectorAll("path[stroke-dasharray]")).not.toHaveLength(0);
    expect(page.getByRole("status").elements()).toHaveLength(0);
  });
  it("uses amount outlines with their own explanation rather than a percentile explanation", async () => {
    render(Harness);
    await button("Compare amounts").click();
    await expect
      .element(
        page.getByText(
          "Dashed outlines show the amount in the second period, over the same time intervals as the filled bars."
        )
      )
      .toBeVisible();
    expect(
      document.querySelectorAll('rect[stroke-dasharray="3 2"]')
    ).toHaveLength(8);
    focusChart();
    await userEvent.keyboard("{End}{Enter}");
    await expect
      .element(page.getByRole("status"))
      .toHaveTextContent("4 U per day");
  });
  it("reacts to units and live theme changes without saving preferences during example interactions", async () => {
    glucoseUnits.current = "mg/dl";
    render(Harness);
    const host = page
      .getByTestId("chart-example-harness")
      .element() as HTMLElement;
    const path = () => host.querySelector('path[stroke="var(--chart-1)"]')!;
    await expect.poll(() => path()).toBeTruthy();
    host.style.setProperty("--chart-1", "rgb(12 100 200)");
    await expect
      .poll(() => getComputedStyle(path()).stroke)
      .toBe("rgb(12, 100, 200)");
    host.classList.add("dark");
    host.style.setProperty("--chart-1", "rgb(230 140 20)");
    await expect
      .poll(() => getComputedStyle(path()).stroke)
      .toBe("rgb(230, 140, 20)");
    glucoseUnits.current = "mmol";
    focusChart();
    await expect
      .element(slider())
      .toHaveAttribute("aria-valuetext", expect.stringContaining("mmol/L"));
    const saved = localStorage.getItem("nocturne-glucose-units");
    await button("Missing data").click();
    await button("Compare amounts").click();
    expect(glucoseUnits.current).toBe("mmol");
    expect(localStorage.getItem("nocturne-glucose-units")).toBe(saved);
  });
  it("distinguishes absent prediction matches from zero error", async () => {
    render(Harness, { kind: "prediction" });
    await button("Missing records").click();
    focusChart();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .element(slider())
      .toHaveAttribute(
        "aria-valuetext",
        expect.stringContaining("no matched predictions")
      );
    await button("Complete example").click();
    focusChart();
    await expect
      .element(slider())
      .toHaveAttribute(
        "aria-valuetext",
        expect.stringContaining("95 predictions")
      );
  });
  it("keeps sleep drill-through inside the example and renders missing nights", async () => {
    render(Harness, { kind: "sleep" });
    const nights = () => page.getByRole("button", { name: /Sleep session on/ });
    await expect.poll(() => nights().elements().length).toBe(7);
    await nights().first().click();
    expect(goto).not.toHaveBeenCalled();
    await button("Missing records").click();
    await expect.poll(() => nights().elements().length).toBe(6);
  });
  for (const kind of [
    "agp",
    "scatter",
    "schedule",
    "bands",
    "prediction",
    "sleep",
  ] as const) {
    it(`renders the real ${kind} chart within a narrow help panel`, async () => {
      render(Harness, { kind, width: 360 });
      const host = page.getByTestId("chart-example-harness").element();
      await expect
        .poll(() => host.querySelectorAll("svg path,svg rect").length)
        .toBeGreaterThan(0);
      expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth + 1);
      expect(goto).not.toHaveBeenCalled();
    });
  }
});
