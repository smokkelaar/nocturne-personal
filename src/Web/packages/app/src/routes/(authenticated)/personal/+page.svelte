<script lang="ts">
  import { HeartPulse, Pill, Activity } from "lucide-svelte";
</script>

<svelte:head><title>Personal · Nocturne</title></svelte:head>
<section class="mx-auto max-w-4xl space-y-6 p-6">
  <h1 class="text-3xl font-semibold">Nocturne Personal</h1>
  <p class="text-muted-foreground">
    Persoonlijke uitbreidingen. Official en Latest blijven ongewijzigd.
  </p>
  <div class="grid gap-4 sm:grid-cols-2">
    <a href="/personal/google" class="rounded-xl border p-6 hover:bg-muted/50">
      <HeartPulse class="mb-4 size-8" />
      <h2 class="text-xl font-medium">Google Health</h2>
      <p class="mt-2 text-muted-foreground">
        Koppel Google, kies stappen, hartslag en gewicht en bekijk de
        geïmporteerde metingen.
      </p>
    </a>
    <a
      href="/personal/medications"
      class="rounded-xl border p-6 hover:bg-muted/50"
    >
      <Pill class="mb-4 size-8" />
      <h2 class="text-xl font-medium">Medicatielogboek</h2>
      <p class="mt-2 text-muted-foreground">
        Registreer Mounjaro of vergelijkbare medicatie, inclusief tijdstip,
        dosis en notities.
      </p>
    </a>
  </div>
  <p class="flex gap-2 rounded-lg border p-4 text-sm">
    <Activity class="size-5 shrink-0" />Dit is een logboek, geen doseeradvies.
    De registraties worden niet gebruikt voor insuline-, IOB- of
    doseerberekeningen.
  </p>
</section>
