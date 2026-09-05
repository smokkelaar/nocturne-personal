import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";
import type { GoogleHealthStatus, PersonalHealthReading } from "$lib/api";
import { googleHealthMocks } from "$lib/test-stubs/personal-google-health";
import GoogleHealthPage from "./google-health-page.svelte";

function status(
  overrides: Partial<GoogleHealthStatus> = {}
): GoogleHealthStatus {
  return {
    configured: false,
    connected: false,
    clientId: "",
    callbackUrl: "",
    historyDays: 7,
    selectedTypes: ["steps", "heart-rate", "weight"],
    grantedTypes: [],
    previewRequired: false,
    capabilities: [
      { dataType: "steps", supported: true },
      { dataType: "heart-rate", supported: true },
      { dataType: "weight", supported: true },
      { dataType: "sleep", supported: true },
    ],
    ...overrides,
  };
}

function weightReadings(count = 1): PersonalHealthReading[] {
  return Array.from({ length: count }, (_, index) => ({
    dataType: "weight",
    mills: 1_700_000_000_000 + index * 60_000,
    value: 72.5 + index,
    unit: "kg",
  }));
}

describe("Google Health page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    googleHealthMocks.status.mockResolvedValue(status());
    googleHealthMocks.readings.mockResolvedValue([]);
    googleHealthMocks.preview.mockResolvedValue({ items: [] });
  });

  it("loads the callback before asking for an import selection", async () => {
    render(GoogleHealthPage);

    await expect
      .element(page.getByRole("checkbox", { name: "Stappen" }))
      .not.toBeInTheDocument();
    await expect
      .element(page.getByLabelText("Callback-URL"))
      .toHaveValue(`${window.location.origin}/personal/google/callback`);
    await expect
      .element(
        page.getByRole("button", { name: "Instellingen opslaan en inloggen" })
      )
      .toBeEnabled();
    expect(googleHealthMocks.status).toHaveBeenCalledTimes(1);
    expect(googleHealthMocks.readings).toHaveBeenCalledExactlyOnceWith({
      dataType: "weight",
      skip: 0,
    });
  });

  it("shows the connected controls without an empty setup form", async () => {
    googleHealthMocks.status.mockResolvedValue(
      status({
        configured: true,
        connected: true,
        grantedTypes: ["steps", "heart-rate", "weight"],
      })
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
        page.getByRole("button", { name: "Instellingen opslaan en inloggen" })
      )
      .not.toBeInTheDocument();
  });

  it("previews available types before importing them", async () => {
    googleHealthMocks.status.mockResolvedValue(
      status({ configured: true, connected: true, previewRequired: true })
    );
    googleHealthMocks.preview.mockResolvedValue({
      items: [
        { dataType: "steps", granted: true, count: 42 },
        { dataType: "sleep", granted: true, count: 0 },
      ],
    });
    render(GoogleHealthPage);

    await expect.element(page.getByText("42 gevonden")).toBeVisible();
    await expect
      .element(page.getByText("Nu geen gegevens gevonden"))
      .toBeVisible();
    await expect
      .element(page.getByRole("checkbox", { name: "Stappen" }))
      .toBeChecked();
    expect(googleHealthMocks.sync).not.toHaveBeenCalled();
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
        page.getByRole("button", { name: "Instellingen opslaan en inloggen" })
      )
      .not.toBeInTheDocument();
    await page.getByRole("button", { name: "Opnieuw laden" }).click();

    await expect.element(page.getByLabelText("Callback-URL")).toBeVisible();
    await expect.element(page.getByRole("alert")).not.toBeInTheDocument();
    expect(googleHealthMocks.status).toHaveBeenCalledTimes(2);
  });

  it("does not claim that readings are empty when the reading request fails", async () => {
    googleHealthMocks.readings.mockRejectedValue({
      status: 503,
      body: { message: "Unavailable" },
    });
    render(GoogleHealthPage);

    await expect.element(page.getByLabelText("Callback-URL")).toBeVisible();
    await expect.element(page.getByRole("alert")).toHaveTextContent("HTTP 503");
    await expect
      .element(
        page.getByText("Geen metingen in deze selectie.", { exact: true })
      )
      .not.toBeInTheDocument();
  });

  it("requests the next offset and resets it when changing the reading type", async () => {
    googleHealthMocks.readings.mockResolvedValue(weightReadings(100));
    render(GoogleHealthPage);

    await page.getByRole("button", { name: "Volgende", exact: true }).click();
    expect(googleHealthMocks.readings).toHaveBeenNthCalledWith(1, {
      dataType: "weight",
      skip: 0,
    });
    expect(googleHealthMocks.readings).toHaveBeenNthCalledWith(2, {
      dataType: "weight",
      skip: 100,
    });

    googleHealthMocks.readings.mockResolvedValue([]);
    await page.getByRole("combobox").selectOptions("steps");

    await expect
      .element(
        page.getByText("Geen metingen in deze selectie.", { exact: true })
      )
      .toBeVisible();
    expect(googleHealthMocks.readings).toHaveBeenNthCalledWith(3, {
      dataType: "steps",
      skip: 0,
    });
    expect(googleHealthMocks.readings).toHaveBeenCalledTimes(3);
    await expect
      .element(page.getByRole("button", { name: "Vorige", exact: true }))
      .toBeDisabled();
  });

  it.each(["type", "page"] as const)(
    "clears stale readings during a %s change and retries the failed selection",
    async (change) => {
      googleHealthMocks.readings.mockResolvedValueOnce(
        weightReadings(change === "page" ? 100 : 1)
      );
      render(GoogleHealthPage);

      const previousReading = page.getByRole("cell", {
        name: "72.5 kg",
        exact: true,
      });
      await expect.element(previousReading).toBeVisible();
      const pending = Promise.withResolvers<PersonalHealthReading[]>();
      googleHealthMocks.readings.mockReturnValueOnce(pending.promise);
      const requested =
        change === "type"
          ? { dataType: "steps", skip: 0 }
          : { dataType: "weight", skip: 100 };

      if (change === "type") {
        await page.getByRole("combobox").selectOptions("steps");
      } else {
        await page
          .getByRole("button", { name: "Volgende", exact: true })
          .click();
      }

      expect(googleHealthMocks.readings).toHaveBeenLastCalledWith(requested);
      await expect.element(previousReading).not.toBeInTheDocument();
      await expect.element(page.getByRole("combobox")).toBeDisabled();
      await expect
        .element(
          page.getByText("Geen metingen in deze selectie.", { exact: true })
        )
        .not.toBeInTheDocument();

      pending.reject({ status: 503, body: { message: "Unavailable" } });

      await expect
        .element(page.getByRole("alert"))
        .toHaveTextContent("HTTP 503");
      await expect.element(previousReading).not.toBeInTheDocument();
      await expect
        .element(
          page.getByText("Geen metingen in deze selectie.", { exact: true })
        )
        .not.toBeInTheDocument();
      googleHealthMocks.readings.mockResolvedValueOnce([
        {
          dataType: requested.dataType,
          mills: 1_700_000_100_000,
          value: change === "type" ? 345 : 71,
          unit: change === "type" ? "steps" : "kg",
        },
      ]);
      await page
        .getByRole("button", { name: "Metingen opnieuw laden", exact: true })
        .click();

      await expect
        .element(
          page.getByRole("cell", {
            name: change === "type" ? "345 stappen" : "71 kg",
            exact: true,
          })
        )
        .toBeVisible();
      await expect.element(page.getByRole("alert")).not.toBeInTheDocument();
      await expect.element(previousReading).not.toBeInTheDocument();
      expect(googleHealthMocks.readings).toHaveBeenLastCalledWith(requested);
      expect(googleHealthMocks.readings).toHaveBeenCalledTimes(3);
      expect(googleHealthMocks.status).toHaveBeenCalledTimes(1);
    }
  );

  it("offers disconnect for saved configuration without an active connection", async () => {
    googleHealthMocks.status.mockResolvedValue(
      status({
        configured: true,
        connected: false,
        clientId: "test-client.apps.googleusercontent.com",
        callbackUrl: "https://nocturne.example/personal/google/callback",
      })
    );
    render(GoogleHealthPage);

    await expect
      .element(
        page.getByRole("button", { name: "Inloggen met Google", exact: true })
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Ontkoppelen", exact: true }))
      .toBeVisible();
  });
});
