<script lang="ts">
  import { onMount } from "svelte";
  import { resolve } from "$app/paths";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Badge } from "$lib/components/ui/badge";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import * as remote from "$lib/api/generated/googleHealthAdmins.generated.remote";
  import { getGoogleHealth } from "$lib/api/generated/googleHealths.generated.remote";
  import type { GoogleHealthAdminStatus, GoogleHealthStatus } from "$api";
  import { errorMessage } from "$lib/forms/submit-error";
  import { errorMessage as connectionError } from "$routes/(authenticated)/settings/connectors/google-health/google-health-copy.svelte";

  const names = ["clientId", "clientSecret", "redirectUri"] as const;
  const labels = {
    clientId: "Client ID",
    clientSecret: "Client secret",
    redirectUri: "Redirect URI",
  };
  const errors: Record<string, string> = {
    encryption_unavailable:
      "Configure the instance encryption key before saving credentials.",
    invalid_client_id: "The client ID must end in .apps.googleusercontent.com.",
    invalid_redirect_uri:
      "Use an HTTPS URL ending in /api/v4/google-health/oauth/callback, without a query or fragment.",
    required:
      "Provide the required client ID, client secret and callback URL in Admin or deployment configuration.",
    matching_secret_required:
      "Enter the matching client secret when changing to a different client ID.",
  };
  let settings = $state<GoogleHealthAdminStatus | null>(null);
  let connection = $state<GoogleHealthStatus | null>(null);
  let enabled = $state(false);
  let fields = $state({ clientId: "", clientSecret: "", redirectUri: "" });
  let inherit = $state({
    clientId: false,
    clientSecret: false,
    redirectUri: false,
  });
  let loading = $state(true);
  let busy = $state(false);
  let checking = $state(false);
  let failure = $state("");
  let saved = $state(false);
  let connectionUnavailable = $state(false);

  async function loadSettings() {
    const result = await remote.getGoogleHealthAdminSettings().run();
    settings = result;
    enabled = result.overrideEnabled ?? false;
    fields = {
      clientId: result.clientId?.adminValue ?? "",
      clientSecret: "",
      redirectUri: result.redirectUri?.adminValue ?? "",
    };
    inherit = { clientId: false, clientSecret: false, redirectUri: false };
  }

  async function checkConnection() {
    checking = true;
    connectionUnavailable = false;
    try {
      connection = await getGoogleHealth().run();
    } catch {
      connection = null;
      connectionUnavailable = true;
    } finally {
      checking = false;
    }
  }

  async function load() {
    loading = true;
    failure = "";
    try {
      await loadSettings();
    } catch {
      failure =
        "Could not load Google Health administration settings. Try again.";
    } finally {
      loading = false;
    }
    await checkConnection();
  }

  onMount(() => {
    queueMicrotask(() => {
      void load();
    });
  });

  async function save(event: SubmitEvent) {
    event.preventDefault();
    busy = true;
    failure = "";
    saved = false;
    try {
      await remote.saveGoogleHealthAdminSettings({
        overrideEnabled: enabled,
        clientId: inherit.clientId ? "" : fields.clientId,
        clientSecret: inherit.clientSecret ? "" : fields.clientSecret,
        redirectUri: inherit.redirectUri ? "" : fields.redirectUri,
        useDeploymentFields: names.filter((name) => inherit[name]),
      });
      await loadSettings();
      saved = true;
      await checkConnection();
    } catch (err) {
      failure = (errorMessage(err) ?? "")
        .split("; ")
        .map(
          (code) =>
            errors[code] ??
            "Could not save these settings. Check the values and try again."
        )
        .join(" ");
    } finally {
      busy = false;
    }
  }

  async function remove() {
    if (
      !confirm(
        "Remove all Google Health Admin overrides and use deployment settings instead? Existing accounts may need to reconnect if the effective client changes."
      )
    )
      return;
    busy = true;
    failure = "";
    saved = false;
    try {
      await remote.removeGoogleHealthAdminSettings();
      await loadSettings();
      saved = true;
      await checkConnection();
    } catch {
      failure = "Could not remove the Admin overrides. Try again.";
    } finally {
      busy = false;
    }
  }
</script>

<div class="space-y-4">
  <Card>
    <CardHeader>
      <CardTitle>Google Health</CardTitle>
      <p class="text-sm text-muted-foreground">
        Configure one OAuth client for this server. Each user still connects
        their own Google account.
      </p>
    </CardHeader>
    <CardContent class="space-y-5">
      {#if loading}<p role="status">Loading Google Health settings...</p>{/if}
      {#if failure}<p role="alert" class="text-destructive">{failure}</p>{/if}
      {#if saved}<p role="status" class="rounded-md border p-3">
          Settings saved and active. No restart is needed.
        </p>{/if}
      {#if settings}
        <div class="flex flex-wrap items-center gap-2" aria-live="polite">
          <Badge variant={settings.isConfigured ? "secondary" : "outline"}>
            {settings.isConfigured
              ? "Ready to connect"
              : "Configuration incomplete"}
          </Badge>
          <span class="text-sm">
            {settings.overrideEnabled
              ? "Admin overrides take priority"
              : "Using deployment settings"}
          </span>
        </div>
        <p class="text-sm text-muted-foreground">
          Ready means the required settings are present and valid in format.
          Google confirms the credentials when an account connects.
        </p>
        <form onsubmit={save} class="space-y-5">
          <fieldset
            disabled={busy || !settings.encryptionAvailable}
            class="space-y-5"
          >
            <label class="flex items-center gap-2 font-medium">
              <Checkbox bind:checked={enabled} />
              Use Admin overrides
            </label>
            <p class="text-sm text-muted-foreground">
              For each field: an enabled Admin value wins, otherwise Nocturne
              uses ENV or deployment configuration. The callback can also come
              from BASE_DOMAIN. Turning overrides off keeps the saved values for
              later.
            </p>
            {#each names as name (name)}
              {@const field = settings[name] ?? {}}
              <div class="space-y-2 rounded-md border p-4">
                <label class="block font-medium" for="google-admin-{name}">
                  {labels[name]}
                </label>
                <div class="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">
                    {field.environmentConfigured ? "ENV: set" : "ENV: not set"}
                  </Badge>
                  <Badge variant="outline">
                    {field.deploymentConfigured
                      ? "Deployment: set"
                      : "Deployment: not set"}
                  </Badge>
                  <Badge variant="outline">
                    {field.adminConfigured ? "Admin: saved" : "Admin: not set"}
                  </Badge>
                  <Badge variant="secondary">
                    {field.source === "admin"
                      ? "Active: Admin"
                      : field.source === "deployment"
                        ? "Active: deployment"
                        : field.source === "base-domain"
                          ? "Active: BASE_DOMAIN"
                          : "Active: missing"}
                  </Badge>
                </div>
                {#if field.valuesDiffer}<p class="text-sm">
                    The Admin and deployment values differ. The active source
                    above determines which one is used.
                  </p>{/if}
                {#if name !== "clientSecret"}
                  <p class="break-all text-sm text-muted-foreground">
                    Deployment value: {field.deploymentValue || "Not set"}
                  </p>
                  <p class="break-all text-sm">
                    Effective value: {field.effectiveValue || "Not set"}
                  </p>
                {/if}
                <Input
                  id="google-admin-{name}"
                  type={name === "clientSecret" ? "password" : "text"}
                  autocomplete={name === "clientSecret"
                    ? "new-password"
                    : "off"}
                  class="w-full"
                  maxlength={name === "clientSecret"
                    ? 4096
                    : name === "clientId"
                      ? 256
                      : 2048}
                  bind:value={fields[name]}
                  disabled={inherit[name]}
                  placeholder={name === "clientSecret" && field.adminConfigured
                    ? "Leave blank to keep the saved secret"
                    : "Enter an Admin override"}
                />
                <label class="flex items-center gap-2 text-sm">
                  <Checkbox bind:checked={inherit[name]} />
                  Clear this Admin value on save and use deployment fallback
                </label>
              </div>
            {/each}
            <p class="text-sm">
              Changing the client ID may require users to reconnect. Imported
              history is kept. A different client ID needs its matching secret.
            </p>
            <div class="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : "Save Google Health settings"}
              </Button>
              {#if settings.adminSettingsStored}<Button
                  type="button"
                  variant="outline"
                  onclick={remove}
                  disabled={busy}
                >
                  Remove Admin overrides
                </Button>{/if}
            </div>
          </fieldset>
        </form>
        {#if !settings.encryptionAvailable}<p role="alert">
            Configure the instance encryption key before saving Admin
            credentials. Deployment settings can still be used.
          </p>{/if}
        <p class="text-sm text-muted-foreground">
          ENV remains managed by Home Assistant, Docker or your deployment.
          Saving here does not rewrite that external configuration. Admin
          overrides persist across restarts and apply to every API replica.
          Removing overrides restores the deployment fallback.
        </p>
        <p class="text-sm">
          <a
            class="underline"
            href="https://console.cloud.google.com/auth/clients"
          >
            Google Cloud clients
          </a>
          ·
          <a
            class="underline"
            href="https://developers.google.com/health/setup"
          >
            Google setup guide
          </a>
        </p>
      {:else if !loading}<Button variant="outline" onclick={load}>
          Retry
        </Button>{/if}
    </CardContent>
  </Card>
  <Card>
    <CardHeader><CardTitle>Your Google connection</CardTitle></CardHeader>
    <CardContent class="space-y-3">
      <p class="text-sm text-muted-foreground">
        This shows your current tenant's saved account authorization and
        synchronization status. It does not show other users' accounts.
      </p>
      <div aria-live="polite">
        {#if checking}<p role="status">Checking connection status...</p>
        {:else if connectionUnavailable}<p>
            Connection status is unavailable here. Select a tenant and open its
            Google Health connector.
          </p>
        {:else if connection}
          <Badge variant={connection.connected ? "secondary" : "outline"}>
            {connection.connected
              ? "Google account linked"
              : "Google account not connected"}
          </Badge>
          {#if connection.errorCode}<p class="mt-2 text-sm">
              {connectionError(connection.errorCode)}
            </p>{/if}
          {#if connection.lastSync}<p class="mt-2 text-sm">
              Last successful Google Health sync: {connection.lastSync.toString()}
            </p>
          {:else}<p class="mt-2 text-sm">
              No successful synchronization has been recorded yet.
            </p>{/if}
          {#if connection.isSyncing}<p role="status">
              Synchronization is in progress.
            </p>{/if}
        {/if}
      </div>
      <div class="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onclick={checkConnection}
          disabled={checking || busy}
        >
          Refresh connection status
        </Button>
        <Button
          variant="outline"
          href={resolve("/settings/connectors/google-health")}
        >
          Open my Google Health connection
        </Button>
      </div>
    </CardContent>
  </Card>
</div>
