<script lang="ts">
  import * as Select from "$lib/components/ui/select";
  import { formatGlucoseValue } from "$lib/utils/formatting";
  import type { GlucoseUnits } from "$lib/utils/formatting";
  import ColorFocusRange from "./ColorFocusRange.svelte";

  type HeatmapMetric =
    | "avgGlucose"
    | "tir"
    | "bolus"
    | "basal"
    | "tdd"
    | "carbs";

  let {
    selectedMetric = $bindable("avgGlucose"),
    units,
    METRIC_OPTIONS,
    HEATMAP_STOPS,
    LEGEND_W,
    LEGEND_THRESHOLDS,
    legendX,
    METRIC_CSS_VARS,
    getMetricMax,
    focusRange = null,
    onFocusRangeChange = () => {},
  } = $props<{
    selectedMetric: HeatmapMetric;
    units: GlucoseUnits;
    METRIC_OPTIONS: { value: HeatmapMetric; label: string }[];
    HEATMAP_STOPS: ReadonlyArray<{ mgdl: number; color: string }>;
    LEGEND_W: number;
    LEGEND_THRESHOLDS: number[];
    legendX: (mgdl: number) => number;
    METRIC_CSS_VARS: Record<Exclude<HeatmapMetric, "avgGlucose">, string>;
    getMetricMax: (metric: HeatmapMetric) => number;
    focusRange?: readonly [number, number] | null;
    onFocusRangeChange?: (range: [number, number] | null) => void;
  }>();
</script>

<div class="mb-6 rounded-lg border border-border bg-card p-3">
  {#if selectedMetric === "avgGlucose"}
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Select.Root
        type="single"
        value={selectedMetric}
        onValueChange={(v) => {
          if (v) selectedMetric = v as HeatmapMetric;
        }}
      >
        <Select.Trigger class="w-[150px] h-8 text-xs print:hidden">
          <span class="truncate">
            {METRIC_OPTIONS.find(
              (o: { value: HeatmapMetric; label: string }) =>
                o.value === selectedMetric
            )?.label ?? "Avg Glucose"}
          </span>
        </Select.Trigger>
        <Select.Content>
          {#each METRIC_OPTIONS as option}
            <Select.Item value={option.value}>
              {option.label}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      <svg
        viewBox="0 0 {LEGEND_W} 48"
        class="h-12 w-full max-w-[420px] text-muted-foreground"
        overflow="visible"
        role="img"
        aria-label="Glucose color scale legend"
      >
        <defs>
          <linearGradient id="heatmap-grad">
            {#each HEATMAP_STOPS as heatmapStop}
              <stop
                offset="{(legendX(heatmapStop.mgdl) / LEGEND_W) * 100}%"
                stop-color={heatmapStop.color}
              />
            {/each}
          </linearGradient>
        </defs>

        <!-- Zone labels -->
        <text
          x={legendX(55)}
          y="10"
          text-anchor="middle"
          font-size="10"
          fill="currentColor"
        >
          Low
        </text>
        <text
          x={legendX(125)}
          y="10"
          text-anchor="middle"
          font-size="10"
          fill="currentColor"
        >
          In Range
        </text>
        <text
          x={legendX(215)}
          y="10"
          text-anchor="middle"
          font-size="10"
          fill="currentColor"
        >
          High
        </text>
        <text
          x={legendX(300)}
          y="10"
          text-anchor="middle"
          font-size="10"
          fill="currentColor"
        >
          Very High
        </text>

        <!-- Gradient bar -->
        <rect
          x="0"
          y="14"
          width={LEGEND_W}
          height="14"
          rx="2"
          fill="url(#heatmap-grad)"
        />

        <!-- Threshold markers -->
        {#each LEGEND_THRESHOLDS as threshold}
          {@const x = legendX(threshold)}
          <line
            x1={x}
            y1={14}
            x2={x}
            y2={32}
            stroke="currentColor"
            stroke-opacity="0.3"
          />
          <text
            {x}
            y={44}
            text-anchor="middle"
            font-size="10"
            fill="currentColor"
          >
            {formatGlucoseValue(threshold, units)}
          </text>
        {/each}
      </svg>
      <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          class="inline-block h-3 w-3 rounded-sm"
          style="background: var(--muted)"
        ></span>
        Other Data (no glucose)
      </div>
    </div>
  {:else}
    {@const metricLabel =
      METRIC_OPTIONS.find(
        (o: { value: HeatmapMetric; label: string }) =>
          o.value === selectedMetric
      )?.label ?? ""}
    {@const metricUnit =
      selectedMetric === "tir" ? "%" : selectedMetric === "carbs" ? "g" : "U"}
    {@const metricMax =
      selectedMetric === "tir" ? 100 : getMetricMax(selectedMetric)}
    {@const cssVar =
      METRIC_CSS_VARS[selectedMetric as Exclude<HeatmapMetric, "avgGlucose">]}
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Select.Root
        type="single"
        value={selectedMetric}
        onValueChange={(v) => {
          if (v) selectedMetric = v as HeatmapMetric;
        }}
      >
        <Select.Trigger class="w-[150px] h-8 text-xs print:hidden">
          <span class="truncate">
            {METRIC_OPTIONS.find(
              (o: { value: HeatmapMetric; label: string }) =>
                o.value === selectedMetric
            )?.label ?? "Avg Glucose"}
          </span>
        </Select.Trigger>
        <Select.Content>
          {#each METRIC_OPTIONS as option}
            <Select.Item value={option.value}>
              {option.label}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      <ColorFocusRange
        {metricLabel}
        unit={metricUnit}
        observedMax={metricMax}
        {cssVar}
        fixedMax={selectedMetric === "tir" ? 100 : undefined}
        {focusRange}
        {onFocusRangeChange}
      />
      <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          class="inline-block h-3 w-3 rounded-sm"
          style="background: var(--muted)"
        ></span>
        No {metricLabel.toLowerCase()} data
      </div>
    </div>
  {/if}
</div>
