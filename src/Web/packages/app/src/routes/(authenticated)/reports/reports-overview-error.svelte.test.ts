import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";

vi.mock("$app/state", () => ({
  page: { data: { effectivePermissions: ["glucose.read", "reports.read"], user: { id: "owner" } } },
}));
vi.mock("#lib/api/reports.remote.js", () => ({ getReportsData: vi.fn() }));
vi.mock("#lib/hooks/date-params.svelte.js", () => ({
  requireDateParamsContext: () => ({ dateRangeInput: {} }),
}));
vi.mock("#lib/hooks/resource-context.svelte.js", () => ({
  contextResource: () => ({
    current: undefined,
    date: { from: new Date(2026, 2, 1), to: new Date(2026, 2, 14) },
    loading: false,
    error: new Error("The summary service is down"),
    refresh: () => {},
  }),
}));

import ReportsOverviewPage from "./+page.svelte";

describe("reports overview error view", () => {
  it("has one top-level heading, and it names the failure", async () => {
    render(ReportsOverviewPage);

    await expect.element(page.getByRole("heading", { level: 1, name: "Could not load reports" })).toBeVisible();
    expect(page.getByRole("heading", { level: 1 }).elements()).toHaveLength(1);
    await expect.element(page.getByRole("heading", { level: 1, name: "Reports", exact: true })).not.toBeInTheDocument();
  });
});
