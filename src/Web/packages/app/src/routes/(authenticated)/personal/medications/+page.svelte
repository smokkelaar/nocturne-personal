<script lang="ts">
  import { onMount } from "svelte";
  import type { PersonalMedicationRecord } from "$lib/api";
  import {
    listPersonalMedications,
    savePersonalMedication,
    deletePersonalMedication,
  } from "$lib/api/generated/personalMedications.generated.remote";
  let rows = $state<PersonalMedicationRecord[]>([]);
  let id = $state("");
  let revision = $state("00000000-0000-0000-0000-000000000000");
  let name = $state("");
  let ingredient = $state("");
  let amount = $state<number | undefined>();
  let unit = $state("mg");
  let status = $state("taken");
  let route = $state("subcutaneous");
  let when = $state("");
  let site = $state("");
  let notes = $state("");
  let originalTime = $state<{
    input: string;
    mills: number;
    offset: number;
  } | null>(null);
  let busy = $state(false);
  let message = $state("");
  let skip = $state(0);
  function localInput(date: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function reset() {
    id = crypto.randomUUID();
    revision = "00000000-0000-0000-0000-000000000000";
    name = "";
    ingredient = "";
    amount = undefined;
    unit = "mg";
    status = "taken";
    route = "subcutaneous";
    when = localInput(new Date());
    originalTime = null;
    site = "";
    notes = "";
  }
  async function load() {
    rows = await listPersonalMedications({ skip });
  }
  async function run(action: () => Promise<unknown>) {
    busy = true;
    message = "";
    try {
      await action();
    } catch {
      message =
        "Niet opgeslagen. Controleer de verplichte velden, eenheid, tijdstip en je rechten. Een registratie kan intussen gewijzigd zijn: vernieuw de lijst voordat je opnieuw probeert.";
    } finally {
      busy = false;
    }
  }
  async function save() {
    const date = new Date(when);
    const unchangedTime = originalTime?.input === when ? originalTime : null;
    await savePersonalMedication({
      id,
      request: {
        name,
        ingredient,
        amount: status === "taken" ? amount : null,
        unit,
        status,
        route,
        mills: unchangedTime?.mills ?? date.getTime(),
        utcOffsetMinutes: unchangedTime?.offset ?? -date.getTimezoneOffset(),
        site: site || null,
        notes: notes || null,
        revision,
      },
    });
    await listPersonalMedications({ skip }).refresh();
    await load();
    reset();
    message = "Registratie opgeslagen.";
  }
  function edit(row: PersonalMedicationRecord) {
    id = row.id ?? "";
    revision = row.revision ?? "";
    name = row.name;
    ingredient = row.ingredient;
    amount = row.amount ?? undefined;
    unit = row.unit;
    status = row.status;
    route = row.route;
    when = localInput(new Date(row.mills ?? 0));
    site = row.site ?? "";
    notes = row.notes ?? "";
    originalTime = {
      input: when,
      mills: row.mills!,
      offset: row.utcOffsetMinutes ?? -new Date(row.mills!).getTimezoneOffset(),
    };
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  onMount(() => {
    reset();
    void run(load);
  });
</script>

<svelte:head><title>Medicatielogboek · Personal</title></svelte:head>
<section class="mx-auto max-w-5xl space-y-6 p-6">
  <a class="underline" href="/personal">Personal</a>
  <h1 class="text-3xl font-semibold">Medicatielogboek</h1>
  <p>
    Voor Mounjaro en soortgelijke medicatie. Registreer wat je daadwerkelijk
    hebt toegediend of overgeslagen. Geen insuline, doseeradvies, penklikken of
    berekening van werkzame medicatie.
  </p>
  <p class="rounded-lg border p-4 text-sm">
    Neem middel, werkzame stof, hoeveelheid en eenheid over van je voorschrift
    of verpakking. Milligram (mg) en microgram zijn verschillende eenheden. De
    app rekent ze niet om en adviseert geen volgend tijdstip.
  </p>
  {#if message}<p role="status" class="rounded border p-3">{message}</p>{/if}
  <form
    class="space-y-4 rounded-xl border p-5"
    onsubmit={(e) => {
      e.preventDefault();
      void run(save);
    }}
  >
    <h2 class="text-xl font-medium">
      {revision === "00000000-0000-0000-0000-000000000000"
        ? "Registratie toevoegen"
        : "Registratie wijzigen"}
    </h2>
    <fieldset disabled={busy} class="grid gap-4 sm:grid-cols-2">
      <label>
        Middel
        <input
          class="mt-1 w-full rounded border bg-background p-2"
          required
          maxlength="120"
          bind:value={name}
          placeholder="Bijvoorbeeld Mounjaro"
        />
      </label>
      <label>
        Werkzame stof
        <input
          class="mt-1 w-full rounded border bg-background p-2"
          required
          maxlength="120"
          bind:value={ingredient}
          placeholder="Bijvoorbeeld tirzepatide"
        />
      </label>
      <label>
        Status
        <select
          class="mt-1 w-full rounded border bg-background p-2"
          bind:value={status}
          onchange={() => {
            if (status === "skipped") amount = undefined;
          }}
        >
          <option value="taken">Toegediend / ingenomen</option>
          <option value="skipped">Overgeslagen</option>
        </select>
      </label>
      <label>
        Tijdstip (tijdzone van deze browser)
        <input
          class="mt-1 w-full rounded border bg-background p-2"
          type="datetime-local"
          required
          bind:value={when}
        />
      </label>
      {#if status === "taken"}
        <label>
          Werkelijk toegediende hoeveelheid
          <input
            class="mt-1 w-full rounded border bg-background p-2"
            type="number"
            required
            min="0.0001"
            max="100000"
            step="0.0001"
            bind:value={amount}
            placeholder="Geen standaarddosis"
          />
        </label>
        <label>
          Eenheid
          <select
            class="mt-1 w-full rounded border bg-background p-2"
            required
            bind:value={unit}
          >
            <option value="mg">mg (milligram)</option>
            <option value="microgram">microgram</option>
          </select>
        </label>
      {/if}
      <label>
        Toedieningswijze
        <select
          class="mt-1 w-full rounded border bg-background p-2"
          required
          bind:value={route}
        >
          <option value="subcutaneous">Onderhuidse injectie</option>
          <option value="oral">Oraal</option>
          <option value="other">Anders (licht toe in notities)</option>
        </select>
      </label>
      <label>
        Plaats (optioneel)
        <input
          class="mt-1 w-full rounded border bg-background p-2"
          maxlength="120"
          bind:value={site}
          placeholder="Eigen omschrijving"
        />
      </label>
      <label class="sm:col-span-2">
        Notities / waargenomen bijwerkingen
        <textarea
          class="mt-1 w-full rounded border bg-background p-2"
          maxlength="2000"
          rows="3"
          bind:value={notes}
        ></textarea>
      </label>
    </fieldset>
    <button
      class="mr-3 rounded bg-primary px-4 py-2 text-primary-foreground"
      disabled={busy}
    >
      Opslaan
    </button>
    <button
      type="button"
      class="rounded border px-4 py-2"
      disabled={busy}
      onclick={reset}
    >
      Nieuw / annuleren
    </button>
  </form>
  <div class="space-y-3">
    <h2 class="text-xl font-medium">Geschiedenis</h2>
    <p class="text-sm text-muted-foreground">
      Tijden worden in de tijdzone van deze browser getoond. De oorspronkelijke
      UTC-offset blijft opgeslagen. Registraties staan los van je
      behandelprofiel en insulinegegevens.
    </p>
    {#if rows.length === 0}<p>Nog geen registraties op deze pagina.</p>{/if}
    {#each rows as row (row.id)}
      <article class="space-y-2 rounded-lg border p-4">
        <div class="flex flex-wrap justify-between gap-2">
          <h3 class="font-semibold">{row.name} · {row.ingredient}</h3>
          <time>{new Date(row.mills ?? 0).toLocaleString()}</time>
        </div>
        <p>
          {row.status === "taken"
            ? `${row.amount} ${row.unit}`
            : "Overgeslagen — geen dosis toegediend"}
        </p>
        <p class="text-sm">
          {row.route === "subcutaneous"
            ? "Onderhuidse injectie"
            : row.route === "oral"
              ? "Oraal"
              : "Anders"}{row.site ? ` · ${row.site}` : ""}
        </p>
        {#if row.notes}<p class="whitespace-pre-wrap">{row.notes}</p>{/if}
        <button
          class="mr-3 rounded border px-3 py-1"
          disabled={busy}
          onclick={() => edit(row)}
        >
          Wijzigen
        </button>
        <button
          class="rounded border px-3 py-1"
          disabled={busy}
          onclick={() => {
            if (confirm("Deze medicatieregistratie definitief verwijderen?"))
              void run(async () => {
                await deletePersonalMedication({
                  id: row.id!,
                  revision: row.revision,
                });
                await listPersonalMedications({ skip }).refresh();
                await load();
              });
          }}
        >
          Verwijderen
        </button>
      </article>
    {/each}
    <button
      class="mr-3 rounded border px-3 py-2"
      disabled={busy || skip === 0}
      onclick={() =>
        run(async () => {
          skip -= 100;
          await load();
        })}
    >
      Vorige
    </button>
    <button
      class="rounded border px-3 py-2"
      disabled={busy || rows.length < 100}
      onclick={() =>
        run(async () => {
          skip += 100;
          await load();
        })}
    >
      Volgende
    </button>
    <button
      class="ml-3 rounded border px-3 py-2"
      disabled={busy}
      onclick={() =>
        run(async () => {
          await listPersonalMedications({ skip }).refresh();
          await load();
        })}
    >
      Vernieuwen
    </button>
  </div>
</section>
