<script lang="ts">
  import { onMount } from "svelte";
  import { resolve } from "$app/paths";
  import type { GoogleHealthStatus, PersonalHealthReading } from "$lib/api";
  import {
    describeGoogleHealthError,
    type GoogleHealthOperation,
  } from "$lib/personal/google-health-error";
  import {
    getPersonalGoogleHealth,
    savePersonalGoogleHealth,
    startPersonalGoogleHealth,
    disconnectPersonalGoogleHealth,
    syncPersonalGoogleHealth,
    purgePersonalGoogleHealth,
    getPersonalHealthReadings,
  } from "$lib/api/generated/personalGoogleHealths.generated.remote";
  let status = $state<GoogleHealthStatus | null>(null);
  let readings = $state<PersonalHealthReading[]>([]);
  let readingsLoaded = $state(false);
  let clientId = $state("");
  let clientSecret = $state("");
  let callbackUrl = $state("");
  let selected = $state<string[]>(["steps", "heart-rate", "weight"]);
  let historyDays = $state(7);
  let type = $state("weight");
  let skip = $state(0);
  let busy = $state(true);
  let message = $state("");
  let operation: GoogleHealthOperation = "status";
  const labels: Record<string, string> = {
    steps: "Stappen",
    "heart-rate": "Hartslag",
    weight: "Gewicht",
    sleep: "Slaap",
    "body-fat": "Vetpercentage",
    distance: "Afstand",
    "oxygen-saturation": "Zuurstofsaturatie",
    "heart-rate-variability": "Hartslagvariabiliteit",
  };
  const errors: Record<string, string> = {
    configure_first: "Sla eerst de Google-configuratie op.",
    invalid_configuration: "Controleer de client-ID en de terugkijkperiode.",
    invalid_callback:
      "Gebruik een HTTPS-domeinnaam met exact het pad /personal/google/callback, zonder extra parameters.",
    invalid_client_credentials:
      "Google heeft de client-ID of het client-secret afgewezen. Controleer de OAuth-client van het type Web application.",
    oauth_scope_configuration:
      "Google accepteert een aangevraagde Health-scope niet. Controleer de OAuth-toestemming en de ingeschakelde Google Health API.",
    oauth_request_invalid:
      "Google heeft de OAuth-aanvraag afgewezen. Controleer de OAuth-client en start de koppeling opnieuw.",
    invalid_token_response:
      "Google gaf geen bruikbare sessie terug. Start de koppeling opnieuw; blijft dit gebeuren, controleer dan de technische code en serverlog.",
    client_secret_required: "Een Google client-secret is eenmalig vereist.",
    connection_owner_required:
      "Alleen de Nocturne-gebruiker die deze koppeling heeft aangemaakt kan haar wijzigen.",
    disconnect_first:
      "Ontkoppel Google eerst voordat je de selectie of instellingen wijzigt.",
    account_mismatch:
      "Dit is een ander Google-account. Wis eerst expliciet de bestaande import als je wilt wisselen.",
    expired_signin:
      "De aanmelding is verlopen of al gebruikt. Start de Google-aanmelding opnieuw.",
    offline_access_required:
      "Geen toegang voor automatische import ontvangen. Trek de app-toegang in bij Google en koppel opnieuw.",
    partial_consent:
      "Google heeft niet alle gevraagde rechten verleend. Alleen de hieronder vermelde typen worden geïmporteerd.",
    permission_denied:
      "Google weigert toegang. Controleer of de Health API is ingeschakeld en geef opnieuw toestemming.",
    reconnect_required:
      "De Google-toegang is verlopen of ingetrokken. Ontkoppel en verbind opnieuw.",
    rate_limited:
      "De Google-limiet is bereikt. De volgende automatische poging volgt later.",
    google_unavailable:
      "Google is tijdelijk niet bereikbaar. Bestaande metingen blijven bewaard.",
    account_not_linked:
      "Dit Google-account is niet gekoppeld aan een Fitbit-account. Rond die koppeling eerst in Fitbit af en probeer daarna opnieuw.",
    invalid_google_request:
      "Google heeft de gegevensaanvraag afgekeurd. Werk Nocturne Personal bij; de eerdere import blijft bewaard.",
    preview_access_denied:
      "Dit Google-account heeft geen toegang tot deze Google Health API-versie.",
    google_resource_not_found:
      "Google Health kent de gevraagde gegevensbron niet voor dit account.",
    data_access_denied:
      "Google staat het lezen van dit gegevenstype niet toe voor dit account.",
    invalid_time_range:
      "Google accepteert de gevraagde terugkijkperiode niet. Kies tijdelijk een kortere periode en probeer opnieuw.",
    invalid_filter_operator:
      "Google accepteert de gebruikte tijdsfilter niet. Werk Nocturne Personal bij.",
    invalid_google_filter:
      "Google heeft de filter voor dit gegevenstype afgewezen. Werk Nocturne Personal bij.",
    invalid_google_data_type:
      "Google herkent het aangevraagde Health-gegevenstype niet. Werk Nocturne Personal bij.",
    invalid_source_family:
      "Google kon de Health-bronnen voor dit gegevenstype niet samenvoegen.",
    invalid_google_response:
      "Google gaf een ongeldig of onvolledig antwoord. De bestaande import is behouden.",
    no_google_data:
      "De import is gelukt, maar Google gaf voor de vermelde typen geen metingen in de ingestelde periode. Controleer in de Google Health- of Fitbit-app of dit account echt gegevens synchroniseert.",
    stored_google_configuration_unreadable:
      "De opgeslagen Google-koppeling is niet meer leesbaar. Ontkoppel lokaal, trek de oude Nocturne-toegang zo nodig ook in bij je Google-account en voer de instellingen opnieuw in. Geïmporteerde metingen blijven staan.",
    unsupported_type:
      "De opgeslagen selectie bevat een gegevenstype dat deze versie niet ondersteunt. Ontkoppel en configureer de koppeling opnieuw.",
    revoke_in_google:
      "Lokaal ontkoppeld. Trek de app-toegang ook in bij je Google-account; dat kon niet automatisch worden bevestigd.",
    history_too_large:
      "Deze periode bevat te veel metingen. Kies een kortere periode.",
    invalid_google_data:
      "Google gaf een onverwacht gegevensformaat. Deze import is niet opgeslagen.",
    duplicate_google_data:
      "Google gaf overlappende metingen. Deze import is niet opgeslagen.",
    unexpected_time_range:
      "De antwoordperiode van Google wijkt af. Deze import is niet opgeslagen.",
    pagination_failed:
      "Niet alle pagina’s konden worden opgehaald. Deze import is niet opgeslagen.",
    internal_sync_connection_read:
      "De import kon de opgeslagen koppeling niet lezen. Controleer de serverlog rond deze poging.",
    internal_sync_session_read:
      "De import kon de beveiligde Google-sessie niet verwerken. Controleer de serverlog rond deze poging.",
    internal_sync_token_refresh:
      "De import liep onverwacht vast bij het vernieuwen van de Google-sessie. Controleer de serverlog rond deze poging.",
    internal_sync_scope_validation:
      "De import liep onverwacht vast bij het controleren van de verleende rechten. Controleer de serverlog rond deze poging.",
    internal_sync_google_read:
      "De import liep onverwacht vast bij het ophalen van Google Health-gegevens. Controleer de serverlog rond deze poging.",
    internal_sync_data_validation:
      "De import liep onverwacht vast bij het controleren van Google Health-gegevens. Controleer de serverlog rond deze poging.",
    internal_sync_database_write:
      "De gegevens zijn opgehaald, maar konden niet in Nocturne worden opgeslagen. Controleer de serverlog rond deze poging.",
  };
  async function loadReadings() {
    operation = "readings";
    readingsLoaded = false;
    readings = [];
    readings = await getPersonalHealthReadings({ dataType: type, skip }).run();
    readingsLoaded = true;
  }
  async function refresh() {
    message = "";
    operation = "status";
    status = await getPersonalGoogleHealth().run();
    clientId = status.clientId ?? "";
    callbackUrl =
      status.callbackUrl ||
      `${window.location.origin}/personal/google/callback`;
    selected = status.configured ? (status.selectedTypes ?? []) : selected;
    historyDays = status.historyDays ?? 7;
    try {
      await loadReadings();
    } catch (error) {
      message = describeGoogleHealthError(error, "readings", errors);
    }
  }
  async function run(action: () => Promise<unknown>) {
    busy = true;
    message = "";
    try {
      await action();
    } catch (error) {
      message = describeGoogleHealthError(error, operation, errors);
    } finally {
      busy = false;
    }
  }
  async function connect() {
    operation = "save";
    status = await savePersonalGoogleHealth({
      clientId,
      clientSecret: clientSecret || null,
      callbackUrl,
      dataTypes: selected,
      historyDays,
    });
    clientSecret = "";
    await startSignin();
  }
  async function startSignin() {
    operation = "signin";
    const authorization = await startPersonalGoogleHealth();
    if (authorization.url) window.location.assign(authorization.url);
  }
  async function disconnect() {
    operation = "disconnect";
    await disconnectPersonalGoogleHealth();
    await refresh();
  }
  onMount(() => {
    let mounted = true;
    // SvelteKit 2.59 rejects query.run() during onMount's effect flush.
    queueMicrotask(() => {
      if (!mounted) return;
      void run(async () => {
        const outcome = new URLSearchParams(window.location.search).get(
          "connection"
        );
        await refresh();
        if (
          outcome === "connected" &&
          status?.connected &&
          !status.lastAttempt
        ) {
          operation = "sync";
          await syncPersonalGoogleHealth();
          await refresh();
        }
        if (!message && outcome === "failed")
          message =
            "Google koppelen is niet gelukt of geannuleerd. Start opnieuw; gebruik hetzelfde Google-account als bij de bestaande import.";
        if (!message && outcome === "provider_denied")
          message =
            "Google heeft geen toestemming teruggegeven. Start opnieuw en keur de gevraagde leesrechten goed.";
        if (!message && outcome === "no_session")
          message =
            "De Nocturne-inlogsessie ontbrak bij de terugkeer van Google. Log opnieuw in bij Nocturne en start daarna de Google-koppeling opnieuw in dezelfde browser.";
      });
    });
    return () => {
      mounted = false;
    };
  });
</script>

{#snippet configurationForm(buttonLabel: string)}
  <form
    class="space-y-4 rounded-xl border p-5"
    onsubmit={(e) => {
      e.preventDefault();
      void run(connect);
    }}
  >
    <fieldset disabled={busy} class="space-y-4 disabled:opacity-60">
      <label class="block">
        Google client-ID
        <input
          class="mt-1 w-full rounded border bg-background p-2"
          required
          bind:value={clientId}
          autocomplete="off"
        />
      </label>
      <label class="block">
        Client-secret
        <input
          class="mt-1 w-full rounded border bg-background p-2"
          type="password"
          bind:value={clientSecret}
          autocomplete="new-password"
          placeholder={status?.configured
            ? "Opgeslagen; leeg laten om te behouden"
            : "Google client-secret"}
        />
      </label>
      <label class="block">
        Callback-URL
        <input
          class="mt-1 w-full rounded border bg-background p-2"
          type="url"
          required
          bind:value={callbackUrl}
        />
      </label>
      <fieldset>
        <legend class="mb-2 font-medium">Wat wil je importeren?</legend>
        {#each status?.capabilities ?? [] as capability (capability.dataType)}<label
            class="mr-5 inline-flex items-center gap-2"
          >
            <input
              type="checkbox"
              bind:group={selected}
              value={capability.dataType}
              disabled={!capability.supported}
            />
            {labels[capability.dataType ?? ""] ??
              capability.dataType}{!capability.supported
              ? " (nog niet beschikbaar)"
              : ""}
          </label>{/each}
      </fieldset>
      <label class="block">
        Terugkijkperiode (1–90 dagen)
        <input
          class="ml-3 w-24 rounded border bg-background p-2"
          type="number"
          required
          min="1"
          max="90"
          bind:value={historyDays}
        />
      </label>
    </fieldset>
    <button
      class="rounded bg-primary px-4 py-2 text-primary-foreground"
      disabled={busy || selected.length === 0}
    >
      {buttonLabel}
    </button>
  </form>
{/snippet}

<svelte:head><title>Google Health · Personal</title></svelte:head>
<section class="mx-auto max-w-4xl space-y-6 p-6">
  <a class="underline" href={resolve("/personal")}>Personal</a>
  <h1 class="text-3xl font-semibold">Google Health</h1>
  <p>
    Alleen lezen uit Google Health. Google Fit en lokale Android Health
    Connect-gegevens zijn niet automatisch beschikbaar. Metingen worden hier in
    Personal getoond, nog niet in de bestaande Nocturne-rapporten.
  </p>
  <details class="rounded-lg border p-4">
    <summary class="cursor-pointer font-medium">
      Eenmalig instellen in Google Cloud
    </summary>
    <ol class="mt-3 list-inside list-decimal space-y-2">
      <li>
        Activeer de Google Health API en maak een OAuth-client van het type Web
        application.
      </li>
      <li>
        Voeg je Google-account als testgebruiker toe als de app in testmodus
        staat.
      </li>
      <li>
        Registreer exact de callback-URL hieronder als Authorized redirect URI.
      </li>
      <li>
        Vul hieronder client-ID en client-secret in. Deel het secret niet in
        GitHub of chat.
      </li>
    </ol>
    <p class="mt-3">
      In Google-testmodus kan de toestemming na zeven dagen verlopen. Voor een
      openbare app gelden aanvullende Google-verificatie-eisen.
    </p>
    <a
      class="underline"
      href="https://developers.google.com/health/setup"
      target="_blank"
      rel="noreferrer"
    >
      Google-instructies
    </a>
  </details>
  {#if message}<p role="alert" class="rounded-lg border border-destructive p-4">
      {message}
    </p>{/if}
  {#if status?.errorCode}<div
      role="status"
      class="space-y-2 rounded-lg border p-4"
    >
      <p>{errors[status.errorCode] ?? "De import kon niet worden afgerond."}</p>
      {#if status.errorDataTypes?.length}<p>
          Betrokken gegevens: {status.errorDataTypes
            .map((item) => labels[item] ?? item)
            .join(", ")}.
        </p>{/if}
      <p class="text-sm text-muted-foreground">
        Technische code: <code>{status.errorCode}</code>
        {status.lastAttempt
          ? ` · laatste poging ${new Date(status.lastAttempt).toLocaleString()}`
          : ""}{status.nextAttempt
          ? ` · volgende poging niet vóór ${new Date(status.nextAttempt).toLocaleString()}`
          : ""}
      </p>
    </div>{/if}
  {#if !status}
    <div class="space-y-3 rounded-xl border p-5" role="status">
      <p>
        {busy
          ? "Koppelingsstatus laden…"
          : "De koppelingsstatus is niet geladen. Probeer opnieuw voordat je de Google-instellingen wijzigt."}
      </p>
      <button
        class="rounded border px-4 py-2"
        disabled={busy}
        onclick={() => void run(refresh)}
      >
        Opnieuw laden
      </button>
    </div>
  {:else if !status.connected}
    {#if status?.configured}
      <div class="space-y-4 rounded-xl border p-5">
        <p>De Google Cloud-configuratie is lokaal en versleuteld opgeslagen.</p>
        <button
          class="rounded bg-primary px-4 py-2 text-primary-foreground"
          disabled={busy}
          onclick={() => void run(startSignin)}
        >
          Inloggen met Google
        </button>
        <details>
          <summary class="cursor-pointer">
            Geavanceerde instellingen wijzigen
          </summary>
          <div class="mt-4">
            {@render configurationForm("Opslaan en opnieuw inloggen")}
          </div>
        </details>
        <button
          class="rounded border px-4 py-2"
          disabled={busy}
          onclick={() => void run(disconnect)}
        >
          Ontkoppelen
        </button>
      </div>
    {:else}
      {@render configurationForm("Instellingen opslaan en inloggen")}
    {/if}
  {/if}
  {#if status?.connected}
    <div class="space-y-3 rounded-lg border p-4">
      <p>
        Verbonden · Import toegestaan: {status.grantedTypes
          ?.map((t) => labels[t])
          .join(", ") || "geen"}
      </p>
      <p>
        Laatste geslaagde import: {status.lastSync
          ? new Date(status.lastSync).toLocaleString()
          : "nog niet uitgevoerd"}
      </p>
      <p>
        Google-sessie: {status.accessTokenExpiresAt &&
        new Date(status.accessTokenExpiresAt) > new Date()
          ? `direct bruikbaar tot ${new Date(status.accessTokenExpiresAt).toLocaleString()}`
          : "wordt bij de volgende import automatisch vernieuwd"}
      </p>
      <p class="text-sm text-muted-foreground">
        Automatisch ongeveer elke 15 minuten. De ingestelde periode wordt
        opnieuw gecontroleerd op correcties en verwijderingen. Oudere import
        blijft bewaard. Geen metingen is niet hetzelfde als nul stappen.
      </p>
      <button
        class="mr-3 rounded border px-4 py-2"
        disabled={busy}
        onclick={() =>
          run(async () => {
            operation = "sync";
            await syncPersonalGoogleHealth();
            await refresh();
          })}
      >
        Nu synchroniseren
      </button>
      <button
        class="rounded border px-4 py-2"
        disabled={busy}
        onclick={() => void run(disconnect)}
      >
        Ontkoppelen
      </button>
    </div>
  {/if}
  {#if status}<div class="space-y-3">
      <h2 class="text-xl font-medium">Geïmporteerde metingen</h2>
      <select
        aria-label="Gegevenstype"
        class="rounded border bg-background p-2"
        bind:value={type}
        disabled={busy}
        onchange={() =>
          run(async () => {
            skip = 0;
            await loadReadings();
          })}
      >
        {#each status?.capabilities?.filter((c) => c.supported) ?? [] as capability (capability.dataType)}<option
            value={capability.dataType}
          >
            {labels[capability.dataType ?? ""] ?? capability.dataType}
          </option>{/each}
      </select>
      <p class="text-sm text-muted-foreground">
        Bron: Google Health, door Google samengevoegde bronnen. Tijdstippen in
        de tijdzone van deze browser. Stappen zijn aantallen per interval, geen
        dagtotalen.
      </p>
      <div class="overflow-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b">
              <th class="p-2">Tijdstip</th>
              <th class="p-2">Einde interval</th>
              <th class="p-2">Waarde</th>
            </tr>
          </thead>
          <tbody>
            {#each readings as row (`${row.dataType}-${row.mills}-${row.endMills ?? ""}`)}<tr
                class="border-b"
              >
                <td class="p-2">{new Date(row.mills ?? 0).toLocaleString()}</td>
                <td class="p-2">
                  {row.endMills ? new Date(row.endMills).toLocaleString() : "—"}
                </td>
                <td class="p-2">
                  {row.value}
                  {row.unit === "steps" ? "stappen" : row.unit}
                </td>
              </tr>{/each}
          </tbody>
        </table>
      </div>
      {#if readingsLoaded && readings.length === 0}<p>
          Geen metingen in deze selectie.
        </p>{/if}
      {#if !readingsLoaded && !busy}
        <button
          class="rounded border px-3 py-2"
          onclick={() => void run(loadReadings)}
        >
          Metingen opnieuw laden
        </button>
      {/if}
      <button
        class="mr-3 rounded border px-3 py-2"
        disabled={busy || !readingsLoaded || skip === 0}
        onclick={() =>
          run(async () => {
            skip -= 100;
            await loadReadings();
          })}
      >
        Vorige
      </button>
      <button
        class="rounded border px-3 py-2"
        disabled={busy || !readingsLoaded || readings.length < 100}
        onclick={() =>
          run(async () => {
            skip += 100;
            await loadReadings();
          })}
      >
        Volgende
      </button>
    </div>{/if}
  {#if status?.configured && !status.connected}<button
      class="rounded border border-destructive px-4 py-2"
      disabled={busy}
      onclick={() => {
        if (
          confirm(
            "Alleen de geïmporteerde Google-metingen in Personal definitief verwijderen? Medicatie en gegevens bij Google blijven behouden."
          )
        )
          void run(async () => {
            operation = "purge";
            await purgePersonalGoogleHealth();
            await refresh();
          });
      }}
    >
      Google-import wissen
    </button>{/if}
</section>
