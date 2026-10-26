<script lang="ts">
  import HelpChartExample from "./HelpChartExample.svelte";
  import HelpReadingAid from "./HelpReadingAid.svelte";
  import { articleFor } from "$lib/help/documentation.svelte";
  import type { ChartExampleKind } from "$lib/help/chart-examples";
  let {
    kind = "bands",
    width = 800,
    path,
  }: { kind?: ChartExampleKind; width?: number; path?: string } = $props();
</script>

<div
  data-testid="chart-example-harness"
  class="w-(--example-width) bg-background text-foreground p-4"
  style:--example-width="{width}px"
>
  {#if path}<HelpReadingAid
      article={articleFor(path, [])}
    />{:else}<HelpChartExample {kind} />{/if}
</div>
