import { afterEach, describe, expect, it, vi } from "vitest";
import { load } from "./+page.server";

type LoadEvent = Parameters<typeof load>[0];

function runLoad(getDashboardChartData: ReturnType<typeof vi.fn>, isAuthenticated = true) {
  vi.stubEnv("BASE_DOMAIN", "nocturne.run");
  return load({
    locals: { apiClient: { chartData: { getDashboardChartData } }, isAuthenticated },
    request: new Request("https://sleepy.nocturne.run/", { headers: { host: "sleepy.nocturne.run" } }),
    parent: async () => ({ tenantless: false, baseDomain: "nocturne.run", dashboardSlugs: [] }),
  } as unknown as LoadEvent) as Promise<{ streamed: { historicalChartData: Promise<unknown> } }>;
}

describe("dashboard page load", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("asks only for the reachable tenants when a tenantless host picks a landing", async () => {
    vi.stubEnv("BASE_DOMAIN", "nocturne.run");
    const getMyTenants = vi.fn().mockResolvedValue([{ slug: "sleepy", displayName: "Sleepy" }]);

    const landing = load({
      locals: { apiClient: { myTenants: { getMyTenants } } },
      request: new Request("https://nocturne.run/", { headers: { host: "nocturne.run" } }),
      parent: async () => ({ tenantless: true, baseDomain: "nocturne.run", dashboardSlugs: [] }),
    } as unknown as LoadEvent);

    await expect(landing).rejects.toMatchObject({ status: 303, location: "https://sleepy.nocturne.run/" });
    expect(getMyTenants).toHaveBeenCalledWith(true);
  });

  it("asks for both chart windows without the heart-rate and step series", async () => {
    const getDashboardChartData = vi.fn().mockResolvedValue({});

    const data = await runLoad(getDashboardChartData);
    await data.streamed.historicalChartData;

    expect(getDashboardChartData).toHaveBeenCalledTimes(2);
    for (const call of getDashboardChartData.mock.calls) expect(call[3]).toBe(false);
  });

  it("does not rerun the layout loads through parent() on a tenant host", async () => {
    vi.stubEnv("BASE_DOMAIN", "nocturne.run");
    const parent = vi.fn();

    await load({
      locals: { apiClient: { chartData: { getDashboardChartData: vi.fn().mockResolvedValue({}) } }, isAuthenticated: true },
      request: new Request("https://sleepy.nocturne.run/", { headers: { host: "sleepy.nocturne.run" } }),
      parent,
    } as unknown as LoadEvent);

    expect(parent).not.toHaveBeenCalled();
  });

  it("asks for no chart data for a viewer the layout redirects to sign-in", async () => {
    const getDashboardChartData = vi.fn().mockResolvedValue({});

    await runLoad(getDashboardChartData, false);

    expect(getDashboardChartData).not.toHaveBeenCalled();
  });

  it("starts the historical window before the initial window resolves", async () => {
    const releases: ((value: unknown) => void)[] = [];
    const getDashboardChartData = vi.fn(() => new Promise((resolve) => releases.push(resolve)));

    const pending = runLoad(getDashboardChartData);
    await vi.waitFor(() => expect(getDashboardChartData).toHaveBeenCalledTimes(2), { timeout: 500 });
    for (const release of releases) release({});
    await pending;
  });
});
