<script lang="ts">
  import { resolve } from "$app/paths";
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
  const policy = $derived(data.privacy);
</script>

<svelte:head><title>{policy.appName ?? "Nocturne"} - About</title></svelte:head>
<h1>{policy.appName ?? "Nocturne"}</h1>
<p>
  Nocturne is a self-hosted application for collecting and viewing diabetes and
  health records in personal charts, histories and reports.
</p>
<p>
  Connecting Google Health is optional. With your permission, Nocturne reads
  steps, heart rate, weight and sleep to show personal activity, measurement and
  sleep histories. After you confirm your selection, synchronization can
  continue in the background. The connector does not write to Google Health.
</p>
<p>
  Access to health records remains subject to Nocturne sign-in and tenant
  permissions. This public page does not display health records.
</p>
{#if policy.published}
  <p>
    Operated by {policy.operatorName}. Privacy contact:
    <a href={"mailto:" + policy.contactEmail}>{policy.contactEmail}</a>
    .
  </p>
{:else}
  <p>
    The operator has not published contact and privacy details for this
    instance.
  </p>
{/if}
<p>
  <a href={resolve("/privacy")}>Read the privacy policy</a>
  ·
  <a href={resolve("/auth/login")}>Open Nocturne</a>
</p>
<p>
  Source code:
  <a href="https://github.com/smokkelaar/nocturne-personal">
    Nocturne Personal
  </a>
  ·
  <a href="https://github.com/nightscout/nocturne">Upstream Nocturne</a>
</p>
