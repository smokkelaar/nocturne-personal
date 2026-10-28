<script lang="ts">
  import FlipHorizontal2 from "@lucide/svelte/icons/flip-horizontal-2";
  import { Button } from "$lib/components/ui/button";

  let {
    metricLabel,
    mirror,
    onMirrorChange,
  }: {
    metricLabel: string;
    mirror: boolean;
    onMirrorChange: (mirror: boolean) => void;
  } = $props();
</script>

<!-- Personal: the palette presets are gone; colors come from the ends and boundaries. -->
<div
  class="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground print:hidden"
  data-testid="color-palette-picker"
>
  <Button
    variant="ghost-muted"
    size="xs"
    aria-pressed={mirror}
    aria-label={`Mirror ${metricLabel} colors`}
    onclick={() => onMirrorChange(!mirror)}
  >
    <FlipHorizontal2 />
    Mirror
  </Button>
</div>
