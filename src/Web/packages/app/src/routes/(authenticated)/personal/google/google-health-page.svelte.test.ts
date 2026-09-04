import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";
import type { GoogleHealthStatus } from "$lib/api";
import { googleHealthMocks } from "$lib/test-stubs/personal-google-health";
import GoogleHealthPage from "./+page.svelte";

function status(
  overrides: Partial<GoogleHealthStatus> = {},
): GoogleHealthStatus {
  return {
    configured: false,
    connected: false,
    clientId: "",
    callbackUrl: "",
    historyDays: 7,
    selectedTypes: ["steps", "heart-rate", "weight"],
    grantedTypes: [],
    capabilities: [
      { dataType: "steps", supported: true },
      { dataType: "heart-rate", supported: true },
      { dataType: "weight", supported: true },
    ],
    ...overrides,
  };
}

describe("Google Health page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    googleHealthMocks.status.mockResolvedValue(status());
    googleHealthMocks.readings.mockResolvedValue([]);
  });

  it("loads the import choices and callback outside the mount effect", async () => {
    render(GoogleHealthPage);

    await expect
      .element(page.getByRole("checkbox", { name: "Stappen" }))
      .toBeChecked();
    await expect
      .element(page.getByRole("checkbox", { name: "Hartslag" }))
      .toBeChecked();
    await expect
      .element(page.getByRole("checkbox", { name: "Gewicht" }))
      .toBeChecked();
    await expect
      .element(page.getByLabelText("Callback-URL"))
      .toHaveValue(`${window.location.origin}/personal/google/callback`);
    await expect
      .element(
        page.getByRole("button", { name: "Instellingen opslaan en inloggen" }),
      )
      .toBeEnabled();
    expect(googleHealthMocks.status).toHaveBeenCalledTimes(1);
  });

  it("shows the connected controls without an empty setup form", async () => {
    googleHealthMocks.status.mockResolvedValue(
      status({
        configured: true,
        connected: true,
        grantedTypes: ["steps", "heart-rate", "weight"],
      }),
    );
    render(GoogleHealthPage);

    await expect
      .element(page.getByRole("button", { name: "Ontkoppelen", exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Nu synchroniseren" }))
      .toBeVisible();
    await expect
      .element(page.getByLabelText("Google client-ID"))
      .not.toBeInTheDocument();
    await expect
      .element(
        page.getByRole("button", { name: "Instellingen opslaan en inloggen" }),
      )
      .not.toBeInTheDocument();
  });

  it("reports an initial 401 and lets a retry load the configuration", async () => {
    googleHealthMocks.status.mockRejectedValueOnce({
      status: 401,
      body: { message: "Unauthorized" },
    });
    render(GoogleHealthPage);

    await expect.element(page.getByRole("alert")).toHaveTextContent("HTTP 401");
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("Technische code:");
    await expect
      .element(
        page.getByRole("button", { name: "Instellingen opslaan en inloggen" }),
      )
      .not.toBeInTheDocument();
    await page.getByRole("button", { name: "Opnieuw laden" }).click();

    await expect
      .element(page.getByRole("checkbox", { name: "Stappen" }))
      .toBeChecked();
    await expect.element(page.getByRole("alert")).not.toBeInTheDocument();
    expect(googleHealthMocks.status).toHaveBeenCalledTimes(2);
  });

  it("does not claim that readings are empty when the reading request fails", async () => {
    googleHealthMocks.readings.mockRejectedValue({
      status: 503,
      body: { message: "Unavailable" },
    });
    render(GoogleHealthPage);

    await expect
      .element(page.getByRole("checkbox", { name: "Stappen" }))
      .toBeChecked();
    await expect.element(page.getByRole("alert")).toHaveTextContent("HTTP 503");
    await expect
      .element(
        page.getByText("Geen metingen in deze selectie.", { exact: true }),
      )
      .not.toBeInTheDocument();
  });

  it("offers disconnect for saved configuration without an active connection", async () => {
    googleHealthMocks.status.mockResolvedValue(
      status({
        configured: true,
        connected: false,
        clientId: "test-client.apps.googleusercontent.com",
        callbackUrl: "https://nocturne.example/personal/google/callback",
      }),
    );
    render(GoogleHealthPage);

    await expect
      .element(
        page.getByRole("button", { name: "Inloggen met Google", exact: true }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Ontkoppelen", exact: true }))
      .toBeVisible();
  });
});
