import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GoogleHealthAdminPanel from "./GoogleHealthAdminPanel.svelte";
import type { GoogleHealthAdminStatus } from "$api";

const mocks = vi.hoisted(() => ({
  settings: vi.fn(),
  connection: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("$lib/api/generated/googleHealthAdmins.generated.remote", () => ({
  getGoogleHealthAdminSettings: () => ({ run: mocks.settings }),
  saveGoogleHealthAdminSettings: mocks.save,
  removeGoogleHealthAdminSettings: mocks.remove,
}));
vi.mock("$lib/api/generated/googleHealths.generated.remote", () => ({
  getGoogleHealth: () => ({ run: mocks.connection }),
}));

function configured(): GoogleHealthAdminStatus {
  return {
    overrideEnabled: false,
    adminSettingsStored: false,
    encryptionAvailable: true,
    isConfigured: true,
    clientId: {
      environmentConfigured: true,
      deploymentConfigured: true,
      adminConfigured: false,
      valuesDiffer: false,
      source: "deployment",
      deploymentValue: "env.apps.googleusercontent.com",
      effectiveValue: "env.apps.googleusercontent.com",
    },
    clientSecret: {
      environmentConfigured: true,
      deploymentConfigured: true,
      adminConfigured: false,
      valuesDiffer: false,
      source: "deployment",
    },
    redirectUri: {
      environmentConfigured: true,
      deploymentConfigured: true,
      adminConfigured: false,
      valuesDiffer: false,
      source: "deployment",
      deploymentValue:
        "https://family.example/api/v4/google-health/oauth/callback",
      effectiveValue:
        "https://family.example/api/v4/google-health/oauth/callback",
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.settings.mockResolvedValue(configured());
  mocks.connection.mockResolvedValue({ connected: false, available: true });
  mocks.save.mockResolvedValue({});
});

describe("Google Health administration", () => {
  it("distinguishes valid configuration from an account connected to Google", async () => {
    render(GoogleHealthAdminPanel);
    await expect
      .element(page.getByText("Ready to connect", { exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByText("Google account not connected", { exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByLabelText("Client secret", { exact: true }))
      .toHaveValue("");
    expect(document.body.textContent?.match(/ENV: set/g)).toHaveLength(3);
  });

  it("saves Admin overrides and confirms immediate activation", async () => {
    render(GoogleHealthAdminPanel);
    await page
      .getByRole("checkbox", { name: "Use Admin overrides", exact: true })
      .click();
    await page
      .getByLabelText("Client ID", { exact: true })
      .fill("admin.apps.googleusercontent.com");
    await page
      .getByLabelText("Client secret", { exact: true })
      .fill("synthetic-new-secret");
    await page
      .getByRole("button", { name: "Save Google Health settings", exact: true })
      .click();
    await expect.poll(() => mocks.save.mock.calls.length).toBe(1);
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideEnabled: true,
        clientId: "admin.apps.googleusercontent.com",
        clientSecret: "synthetic-new-secret",
        useDeploymentFields: [],
      })
    );
    await expect
      .element(
        page.getByText("Settings saved and active. No restart is needed.")
      )
      .toBeVisible();
  });

  it("shows the user's linked account and last successful sync", async () => {
    await page.viewport(1100, 2400);
    const admin = configured();
    admin.overrideEnabled = true;
    admin.adminSettingsStored = true;
    admin.clientId = {
      ...admin.clientId,
      source: "admin",
      adminConfigured: true,
      valuesDiffer: true,
      adminValue: "admin.apps.googleusercontent.com",
      effectiveValue: "admin.apps.googleusercontent.com",
    };
    admin.clientSecret = {
      ...admin.clientSecret,
      source: "admin",
      adminConfigured: true,
      valuesDiffer: true,
    };
    mocks.settings.mockResolvedValue(admin);
    mocks.connection.mockResolvedValue({
      connected: true,
      available: true,
      lastSync: "2026-10-23T10:00:00Z",
    });
    render(GoogleHealthAdminPanel);
    await expect
      .element(page.getByText("Google account linked", { exact: true }))
      .toBeVisible();
    await expect
      .element(
        page.getByText("Last successful Google Health sync:", { exact: false })
      )
      .toBeVisible();
    await page
      .getByRole("button", { name: "Refresh connection status" })
      .click();
    await expect.poll(() => mocks.connection.mock.calls.length).toBe(2);
  });

  it("reports an unreadable tenant connection without blocking Admin configuration", async () => {
    mocks.connection.mockRejectedValue(new Error("no_tenant"));
    render(GoogleHealthAdminPanel);
    await expect
      .element(
        page.getByText("Connection status is unavailable here.", {
          exact: false,
        })
      )
      .toBeVisible();
    await expect
      .element(
        page.getByRole("button", {
          name: "Save Google Health settings",
          exact: true,
        })
      )
      .toBeEnabled();
    await expect
      .element(page.getByText("Google account linked", { exact: true }))
      .not.toBeInTheDocument();
  });
});
