<!--
  The eHbA1c timeline: one line coloured by the zone each value falls in, a dashed rule at each zone
  boundary, lab results as triangles, and a zoom onto part of the period. `lineMode` picks hard zone
  colours or a blend between them; `zoomMode` picks dragging across the chart or an overview strip
  below it; `boundaryLabels` picks labels on the rules or colour-coded rules named in the key only.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { Chart, Svg, Axis, Spline, Rule, Text, LinearGradient, BrushContext, Highlight, type ChartState } from "layerchart";
  import { scaleTime, scaleLinear } from "d3-scale";
  import { curveMonotoneX } from "d3";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import { Button } from "#lib/components/ui/button/index.js";
  import { formatLongDate, formatShortDate } from "#lib/utils/formatting.js";

  export type TimelinePoint = { date: Date; displayValue: number };
  export type LabPoint = { id?: string; date: Date; displayValue: number; title: string };
  /** A zone boundary: values above `value` belong to the next zone up. */
  export type ZoneBoundary = { key: string; label: string; value: number; valueLabel: string };
  export type Zone = { key: string; color: string };

  interface Props {
    data: TimelinePoint[];
    labPoints: LabPoint[];
    /** Low to high: the boundaries between `zones`, so one fewer than zones. */
    boundaries: ZoneBoundary[];
    /** Low to high. */
    zones: Zone[];
    yDomain: [number, number];
    lineMode: "zones" | "blend";
    zoomMode: "drag" | "overview";
    boundaryLabels: "inline" | "key";
    /** The visible period; null shows all of it. */
    zoom: [Date, Date] | null;
    onZoom: (domain: [Date, Date] | null) => void;
    tooltip: Snippet<[ChartState<TimelinePoint>]>;
  }

  let {
    data,
    labPoints,
    boundaries,
    zones,
    yDomain,
    lineMode,
    zoomMode,
    boundaryLabels,
    zoom,
    onZoom,
    tooltip,
  }: Props = $props();

  const DAY_MS = 24 * 60 * 60 * 1000;
  /** A drag narrower than this is a click, not a zoom. */
  const MIN_ZOOM_MS = 7 * DAY_MS;

  const fullDomain = $derived.by((): [Date, Date] => {
    const first = data[0]?.date ?? new Date();
    const last = data[data.length - 1]?.date ?? new Date();
    return [first, last];
  });
  const xDomain = $derived(zoom ?? fullDomain);

  /**
   * Stops for a vertical gradient in plot pixels: offset 0 is the top of the plot. Zones are low to
   * high, so they run bottom to top.
   */
  function lineStops(yScale: (v: number) => number, height: number): [number, string][] {
    if (height <= 0 || zones.length === 0) return [];
    const offset = (v: number) => Math.max(0, Math.min(1, yScale(v) / height));
    if (lineMode === "zones") {
      const stops: [number, string][] = [];
      for (let i = zones.length - 1; i >= 0; i--) {
        const top = i === zones.length - 1 ? 0 : offset(boundaries[i].value);
        const bottom = i === 0 ? 1 : offset(boundaries[i - 1].value);
        stops.push([top, zones[i].color], [bottom, zones[i].color]);
      }
      return stops;
    }
    // A blend: each zone's colour sits at the middle of the zone, so the line changes colour
    // gradually across each boundary instead of at it.
    const lows = [yDomain[0], ...boundaries.map((b) => b.value)];
    const highs = [...boundaries.map((b) => b.value), Math.max(yDomain[1], (boundaries.at(-1)?.value ?? 0) + 1)];
    return zones
      .map((zone, i): [number, string] => [offset((lows[i] + highs[i]) / 2), zone.color])
      .reverse();
  }

  /** The colour of the zone `value` falls in, for a dashed rule drawn in the colour of the zone above it. */
  function zoneAbove(index: number): string {
    return zones[index + 1]?.color ?? "var(--muted-foreground)";
  }

  function handleBrushEnd(e: { brush: { x: Array<number | Date | string | null> } }) {
    const [start, end] = e.brush.x ?? [];
    if (start == null || end == null) return;
    const from = new Date(start);
    const to = new Date(end);
    if (to.getTime() - from.getTime() < MIN_ZOOM_MS) return;
    onZoom([from, to]);
  }

  function handleOverview(e: { brush: { x: Array<number | Date | string | null> } }) {
    const [start, end] = e.brush.x ?? [];
    if (start == null || end == null) return;
    const from = new Date(start);
    const to = new Date(end);
    const whole = from.getTime() <= fullDomain[0].getTime() && to.getTime() >= fullDomain[1].getTime();
    onZoom(whole ? null : [from, to]);
  }

  /** Past half a year the ticks name the year too, since a month then recurs along the axis. */
  function tickFormat(v: unknown): string {
    if (!(v instanceof Date)) return String(v);
    return formatShortDate(v, xDomain[1].getTime() - xDomain[0].getTime() > 180 * DAY_MS);
  }

  const padding = $derived({ top: 8, right: boundaryLabels === "inline" ? 8 : 16, bottom: 24, left: 40 });
</script>

<div class="space-y-2">
  <div class="h-[320px] w-full @md:h-[400px]" data-testid="ehba1c-chart" data-line-mode={lineMode} data-zoom-mode={zoomMode}>
    <Chart
      {data}
      x="date"
      y="displayValue"
      xScale={scaleTime()}
      {xDomain}
      yScale={scaleLinear()}
      {yDomain}
      {padding}
      tooltipContext={{ mode: "bisect-x" }}
    >
      {#snippet children({ context })}
        {@const stops = lineStops(context.yScale, context.height)}
        <Svg>
          <Axis
            placement="left"
            ticks={5}
            tickLabelProps={{ class: "text-xs fill-muted-foreground", fontSize: 12 }}
          />
          <Axis
            placement="bottom"
            ticks={6}
            format={tickFormat}
            tickOcclusion
            tickLabelProps={{ class: "text-xs fill-muted-foreground", fontSize: 12 }}
          />

          {#each boundaries as boundary, i (boundary.key)}
            {#if boundary.value > yDomain[0] && boundary.value < yDomain[1]}
              <Rule
                y={boundary.value}
                stroke={boundaryLabels === "key" ? zoneAbove(i) : "var(--muted-foreground)"}
                class={boundaryLabels === "key" ? "stroke-2 opacity-80" : "stroke-1 opacity-60"}
                dashArray="6 4"
                data-testid="ehba1c-boundary"
              />
              {#if boundaryLabels === "inline"}
                <Text
                  x={context.width - 4}
                  y={context.yScale(boundary.value) - 4}
                  value={`${boundary.label} ${boundary.valueLabel}`}
                  textAnchor="end"
                  class="text-2xs fill-muted-foreground"
                />
              {/if}
            {/if}
          {/each}

          <!-- Clip to the plot, so a zoomed line does not run over the axes. -->
          <defs>
            <clipPath id="ehba1c-plot-clip">
              <rect x="0" y="0" width={context.width} height={context.height}></rect>
            </clipPath>
          </defs>
          <g clip-path="url(#ehba1c-plot-clip)">
            <LinearGradient stops={stops} units="userSpaceOnUse" vertical y1="0" y2={String(context.height)}>
              {#snippet children({ gradient })}
                <Spline
                  {data}
                  x="date"
                  y="displayValue"
                  curve={curveMonotoneX}
                  stroke={gradient}
                  class="stroke-3 fill-none"
                  stroke-linecap="round"
                  data-testid="ehba1c-line"
                />
              {/snippet}
            </LinearGradient>

            {#each labPoints as point (point.id ?? point.date.getTime())}
              {@const px = context.xScale(point.date)}
              {@const py = context.yScale(point.displayValue)}
              <polygon
                data-testid="lab-marker"
                points="{px},{py - 7} {px - 6},{py + 5} {px + 6},{py + 5}"
                class="fill-foreground stroke-background"
                stroke-width="1"
                pointer-events="none"
              >
                <title>{point.title}</title>
              </polygon>
            {/each}
          </g>

          <Highlight lines={{ class: "stroke-muted-foreground/50" }} points={{ class: "fill-foreground stroke-background" }} />
        </Svg>

        {#if zoomMode === "drag"}
          <BrushContext
            axis="x"
            clickToReset={false}
            onBrushEnd={handleBrushEnd}
            classes={{ range: "bg-primary/15 border border-primary/40 rounded" }}
          />
        {/if}

        {@render tooltip(context)}
      {/snippet}
    </Chart>
  </div>

  {#if zoomMode === "overview" && data.length > 1}
    <div class="h-[64px] w-full print:hidden" data-testid="ehba1c-overview">
      <Chart
        {data}
        x="date"
        y="displayValue"
        xScale={scaleTime()}
        xDomain={fullDomain}
        yScale={scaleLinear()}
        {yDomain}
        padding={{ top: 4, right: padding.right, bottom: 4, left: padding.left }}
      >
        {#snippet children({ context })}
          {@const stops = lineStops(context.yScale, context.height)}
          <Svg>
            <LinearGradient stops={stops} units="userSpaceOnUse" vertical y1="0" y2={String(context.height)}>
              {#snippet children({ gradient })}
                <Spline {data} x="date" y="displayValue" curve={curveMonotoneX} stroke={gradient} class="stroke-2 fill-none" />
              {/snippet}
            </LinearGradient>
          </Svg>
          <BrushContext
            axis="x"
            x={zoom ?? fullDomain}
            onBrushEnd={handleOverview}
            classes={{
              range: "bg-primary/20 border border-primary/40 rounded",
              handle: "bg-primary/60 hover:bg-primary/80 rounded-sm",
            }}
          />
        {/snippet}
      </Chart>
    </div>
  {/if}

  {#if zoom}
    <div class="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground print:hidden">
      <span>
        Showing {formatLongDate(zoom[0])} to {formatLongDate(zoom[1])}
      </span>
      <Button variant="link" size="xs" onclick={() => onZoom(null)} data-testid="ehba1c-reset-zoom">
        <RotateCcw size={10} />
        Reset zoom
      </Button>
    </div>
  {:else if zoomMode === "drag"}
    <p class="text-center text-xs text-muted-foreground print:hidden">Drag across the chart to zoom in on a period.</p>
  {:else}
    <p class="text-center text-xs text-muted-foreground print:hidden">Drag the edges of the strip to zoom in on a period.</p>
  {/if}
</div>
