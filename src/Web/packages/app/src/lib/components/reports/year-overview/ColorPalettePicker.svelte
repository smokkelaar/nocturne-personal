<script lang="ts">
  import FlipHorizontal2 from "@lucide/svelte/icons/flip-horizontal-2";
  import { Button } from "$lib/components/ui/button";
  import {
    COLOR_PALETTES,
    paletteSwatchGradient,
    samePalette,
  } from "$lib/utils/metric-color-palette";

  let {
    metricLabel,
    themeColors,
    palette,
    mirror,
    onPaletteChange,
    onMirrorChange,
  }: {
    metricLabel: string;
    /** The theme ramp's colors, for the swatch that clears the palette. */
    themeColors: readonly string[];
    palette?: readonly string[];
    mirror: boolean;
    onPaletteChange: (palette: string[] | null) => void;
    onMirrorChange: (mirror: boolean) => void;
  } = $props();

  const options = $derived([
    { label: "Theme", colors: themeColors, palette: null },
    ...COLOR_PALETTES.map((p) => ({ ...p, palette: [...p.colors] })),
  ]);
</script>

<div
  class="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground print:hidden"
  data-testid="color-palette-picker"
>
  <div
    class="flex flex-wrap items-center gap-1.5"
    role="group"
    aria-label={`${metricLabel} color palettes`}
  >
    {#each options as option (option.label)}
      {@const selected = option.palette
        ? samePalette(palette, option.palette)
        : !palette}
      <!-- eslint-disable-next-line no-restricted-syntax -- palette swatch; its gradient background is the content -->
      <button
        type="button"
        title={option.label}
        aria-label={`${option.label} palette`}
        aria-pressed={selected}
        class={[
          "size-5 rounded-full border border-border bg-(image:--swatch) shadow-sm transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50",
          selected
            ? "scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background"
            : "hover:scale-105",
        ]}
        style:--swatch={paletteSwatchGradient(
          mirror ? [...option.colors].reverse() : option.colors
        )}
        onclick={() => onPaletteChange(option.palette)}
      ></button>
    {/each}
  </div>
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
