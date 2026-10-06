import { render } from "vitest-browser-svelte";
import { describe, expect, it, vi } from "vitest";
import Harness from "./ActogramHarness.test.svelte";

describe.each(["steps", "heart-rate"] as const)("%s actogram", (metric) => {
  it.each([
    { targetLow: 70, targetHigh: 180 },
    { targetLow: 100, targetHigh: 100 },
    { targetLow: 0, targetHigh: 0 },
  ])("renders readings with target bounds $targetLow / $targetHigh", async (targets) => {
    const { container } = render(Harness, { metric, ...targets });
    const selector = metric === "steps"
      ? '[data-testid="step-reading"]'
      : '[data-testid="heart-rate-reading"]';

    await vi.waitFor(() => {
      expect(container.querySelectorAll(selector)).toHaveLength(2);
      expect(container.querySelectorAll("circle.lc-circle")).toHaveLength(2);
      const limits = container.querySelectorAll("line");
      expect(limits).toHaveLength(2);
      for (const limit of limits) {
        expect(Number(limit.getAttribute("y1"))).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
