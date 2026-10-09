<script lang="ts">
  import { onMount } from "svelte";
  import { SvelteMap } from "svelte/reactivity";
  import { LineChart, Tooltip } from "layerchart";
  import Loader2 from "@lucide/svelte/icons/loader-circle";
  import Activity from "@lucide/svelte/icons/activity";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import * as Card from "$lib/components/ui/card";
  import * as ToggleGroup from "$lib/components/ui/toggle-group";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { ConfirmDialog } from "$lib/components/ui/confirm-dialog";
  import {
    getAvailableYears,
    getEHbA1cTimeline,
  } from "$api/generated/dataOverviews.generated.remote";
  import * as labResultsApi from "$api/generated/labHbA1cs.generated.remote";
  import type { EHbA1cPoint, LabHbA1cResult } from "$api/generated/nocturne-api-client";
  import { bg, bgLabel, formatLongDate } from "$lib/utils/formatting";
  import { describeSubmitError } from "$lib/forms/submit-error";
  import { setReportPrintMeta } from "$lib/components/reports/print/report-print.svelte";
  import ChartKey from "$lib/components/charts/print/ChartKey.svelte";
  import {
    CHART_TEXTURES,
    patternClass,
    type TextureKey,
  } from "$lib/components/charts/print/chart-print-patterns";

  type ChartPoint = {
    date: Date;
    estimatedA1cPercent: number;
    linear90DayPercent: number | null;
    halfLife30DayPercent: number | null;
    unweighted90DayPercent: number | null;
    weighted120DayPercent: number | null;
    unweighted14DayPercent: number | null;
    weightedAverageGlucoseMgdl: number;
    readingCount: number;
    daysWithData: number;
  };

  type A1cUnit = "percent" | "mmol";

  /**
   * No lab reference range for a non-diabetic adult goes below this, so the chart neither
   * draws nor colors that region — it would only be empty space.
   */
  const MIN_A1C_PERCENT = 4.0;

  /**
   * Reference zones for the legend/bands, in DCCT/NGSP %. Bounds are the widely-cited ADA
   * thresholds (normal < 5.7%, prediabetes 5.7–6.4%, diabetes ≥ 6.5%); "Type 1 diabetes
   * target" uses the general ADA adult target of < 7.0%, and "Elevated"/"Very high" split the
   * range above that at 9.0%, where complication risk rises sharply. Swatches reuse the GRI
   * report's green/yellow-green/orange/red severity scale; band fills use dedicated,
   * dark-mode-tuned tokens (the swatch colors are too subtle at chart-fill opacity, and
   * --glucose-in-range/--chart-2 turned out to be the same color when tried here).
   */
  const A1C_ZONES: { key: string; label: string; maxPercent: number; swatch: string; texture: Extract<TextureKey, `ehba1c-zone-${string}`> }[] = [
    { key: "healthy", label: "Non-diabetic range", maxPercent: 5.7, swatch: "var(--gri-zone-a)", texture: "ehba1c-zone-healthy" },
    { key: "target", label: "Type 1 diabetes target", maxPercent: 7.0, swatch: "var(--gri-zone-b)", texture: "ehba1c-zone-target" },
    { key: "high", label: "Elevated", maxPercent: 9.0, swatch: "var(--gri-zone-d)", texture: "ehba1c-zone-high" },
    { key: "veryHigh", label: "Very high", maxPercent: 14.0, swatch: "var(--gri-zone-e)", texture: "ehba1c-zone-very-high" },
  ];

  const METHOD_SERIES = [
    { key: "current", label: "Current smooth 90-day", color: "var(--ehba1c-line)" },
    { key: "linear", label: "Linear 90-to-1", color: "var(--ehba1c-linear)" },
    { key: "halfLife", label: "30-day half-life", color: "var(--ehba1c-half-life)" },
    { key: "unweighted", label: "Unweighted 90-day", color: "var(--ehba1c-unweighted)" },
    { key: "weighted120", label: "120-day 50/25/25", color: "var(--ehba1c-weighted-120)" },
    { key: "short14", label: "Unweighted 14-day", color: "var(--ehba1c-short-14)" },
  ] as const;
  let loading = $state(true);
  let error = $state<unknown>(null);
  let pointsByYear = $state<Map<number, EHbA1cPoint[]>>(new Map());
  let a1cUnit = $state<A1cUnit>("percent");

  let labResults = $state<LabHbA1cResult[]>([]);
  let newLabDate = $state("");
  let newLabValue = $state("");
  let newLabNote = $state("");
  let savingLabResult = $state(false);
  let labResultError = $state<string | null>(null);
  let pendingDeleteLabResult = $state<LabHbA1cResult | null>(null);

  /** NGSP % to IFCC mmol/mol, the standard dual-reporting conversion for HbA1c. */
  function toIfccMmolMol(percent: number): number {
    return (percent - 2.15) * 10.929;
  }

  function toDisplayUnit(percent: number): number {
    return a1cUnit === "percent" ? percent : toIfccMmolMol(percent);
  }

  /** Normalizes a lab result's measuredAt (Date instance or ISO string) to a Date. */
  function toDate(value: Date | string | undefined): Date {
    return value instanceof Date ? value : new Date(value ?? 0);
  }

  function dateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }
  /** IFCC mmol/mol to NGSP %, the inverse of toIfccMmolMol — used to store a mmol/mol entry as %. */
  function toPercentFromDisplayUnit(value: number): number {
    return a1cUnit === "percent" ? value : value / 10.929 + 2.15;
  }

  function formatA1c(percent: number): string {
    return a1cUnit === "percent"
      ? `${percent.toFixed(1)}%`
      : `${Math.round(toIfccMmolMol(percent))} mmol/mol`;
  }

  function formatDisplayValue(value: number): string {
    return a1cUnit === "percent"
      ? `${value.toFixed(1)}%`
      : `${Math.round(value)} mmol/mol`;
  }
  function toChartPoints(pointsMap: Map<number, EHbA1cPoint[]>): ChartPoint[] {
    const all: ChartPoint[] = [];
    for (const points of pointsMap.values()) {
      for (const point of points) {
        const [y, m, d] = (point.date ?? "").split("-").map(Number);
        if (!y || !m || !d) continue;
        all.push({
          date: new Date(y, m - 1, d),
          estimatedA1cPercent: point.estimatedA1cPercent ?? 0,
          linear90DayPercent: point.linear90DayPercent ?? null,
          halfLife30DayPercent: point.halfLife30DayPercent ?? null,
          unweighted90DayPercent: point.unweighted90DayPercent ?? null,
          weighted120DayPercent: point.weighted120DayPercent ?? null,
          unweighted14DayPercent: point.unweighted14DayPercent ?? null,
          weightedAverageGlucoseMgdl: point.weightedAverageGlucoseMgdl ?? 0,
          readingCount: point.readingCount ?? 0,
          daysWithData: point.daysWithData ?? 0,
        });
      }
    }
    return all.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  const chartData = $derived(toChartPoints(pointsByYear));

  const timelineBounds = $derived.by(() => {
    const dates = [...pointsByYear.values()]
      .flat()
      .map((p) => p.date)
      .filter((d): d is string => !!d)
      .sort();
    return dates.length > 0 ? { from: dates[0], to: dates[dates.length - 1] } : null;
  });

  setReportPrintMeta(() => (timelineBounds ? { period: timelineBounds } : {}));
  const latest = $derived(chartData.length > 0 ? chartData[chartData.length - 1] : undefined);

  const extremes = $derived.by(() => {
    if (chartData.length === 0) return undefined;
    let highest = chartData[0];
    let lowest = chartData[0];
    for (const p of chartData) {
      if (p.estimatedA1cPercent > highest.estimatedA1cPercent) highest = p;
      if (p.estimatedA1cPercent < lowest.estimatedA1cPercent) lowest = p;
    }
    return { highest, lowest };
  });

  const zoneBands = $derived(
    A1C_ZONES.map((zone, i) => {
      const minPercent = i === 0 ? MIN_A1C_PERCENT : A1C_ZONES[i - 1].maxPercent;
      return {
        ...zone,
        minPercent,
        isLast: i === A1C_ZONES.length - 1,
        yMin: toDisplayUnit(minPercent),
        yMax: toDisplayUnit(zone.maxPercent),
      };
    })
  );

  function formatZoneRange(band: (typeof zoneBands)[number]): string {
    const unit = a1cUnit === "percent" ? "%" : " mmol/mol";
    const fmt = (p: number) => (a1cUnit === "percent" ? p.toFixed(1) : `${Math.round(toIfccMmolMol(p))}`);
    if (band.isLast) return `> ${fmt(band.minPercent)}${unit}`;
    return `${fmt(band.minPercent)}–${fmt(band.maxPercent)}${unit}`;
  }

  /** Fixed floor at the never-goes-lower bound; auto-scaled ceiling with a little headroom. */
  const yDomain = $derived.by((): [number, number] => {
    const estimates = chartData.flatMap((p) => [
      p.estimatedA1cPercent,
      p.linear90DayPercent,
      p.halfLife30DayPercent,
      p.unweighted90DayPercent,
      p.weighted120DayPercent,
      p.unweighted14DayPercent,
    ]).filter((value): value is number => value != null);
    const dataMaxPercent = estimates.length > 0
      ? Math.max(...estimates)
      : A1C_ZONES[1].maxPercent;
    const maxPercent = Math.max(dataMaxPercent + 0.5, A1C_ZONES[1].maxPercent);
    return [toDisplayUnit(MIN_A1C_PERCENT), toDisplayUnit(maxPercent)];
  });

  // Clamped to yDomain so a band never computes to a pixel position outside the plot area —
  // an unclamped "very high" band (up to 14%) otherwise rendered above the chart's actual
  // top edge and, since the chart container doesn't clip by default, bled out over the toggle.
  const annotations = $derived(
    zoneBands
      .map((band) => {
        const yMin = Math.max(band.yMin, yDomain[0]);
        const yMax = Math.min(band.yMax, yDomain[1]);
        if (yMax <= yMin) return null;
        const y: [number, number] = [yMin, yMax];
        return {
          type: "range" as const,
          layer: "below" as const,
          y,
          fill: CHART_TEXTURES[band.texture].color,
          class: patternClass(band.texture),
        };
      })
      .filter((band) => band !== null)
  );

  async function loadAll() {
    loading = true;
    error = null;
    try {
      const [{ years }, results] = await Promise.all([
        getAvailableYears().run(),
        labResultsApi.getAll().run(),
      ]);
      labResults = results ?? [];
      const pointResults = await Promise.all(
        (years ?? []).map(async (year) => {
          const response = await getEHbA1cTimeline({ year }).run();
          return [year, response.points ?? []] as const;
        })
      );
      pointsByYear = new Map(pointResults);
    } catch (err) {
      error = err;
      console.error("Failed to load eHbA1c timeline:", err);
    } finally {
      loading = false;
    }
  }

  /** Lab draws are shown as standalone markers — never connected by a line and never fed back
   * into the eHbA1c calculation, which only ever reads SensorGlucose/MeterGlucose. */
  const labChartPoints = $derived(
    labResults.map((r) => ({
      id: r.id,
      date: toDate(r.measuredAt),
      valuePercent: r.valuePercent ?? 0,
      displayValue: toDisplayUnit(r.valuePercent ?? 0),
      note: r.note,
    }))
  );

  function displayRow(point: ChartPoint) {
    return {
      date: point.date,
      current: toDisplayUnit(point.estimatedA1cPercent),
      linear: point.linear90DayPercent == null ? null : toDisplayUnit(point.linear90DayPercent),
      halfLife: point.halfLife30DayPercent == null ? null : toDisplayUnit(point.halfLife30DayPercent),
      unweighted: point.unweighted90DayPercent == null ? null : toDisplayUnit(point.unweighted90DayPercent),
      weighted120: point.weighted120DayPercent == null ? null : toDisplayUnit(point.weighted120DayPercent),
      short14: point.unweighted14DayPercent == null ? null : toDisplayUnit(point.unweighted14DayPercent),
    };
  }

  const displayChartData = $derived.by(() => {
    const estimates = chartData.map(displayRow);
    const rows = new SvelteMap(estimates.map((point) => [point.date.getTime(), point]));
    // Interpolated rows are hover targets only, never inputs to the estimates or summaries.
    // Labs stay in the marker layer: a second series would draw a line joining lab results.
    for (const labPoint of labChartPoints) {
      const timestamp = labPoint.date.getTime();
      if (rows.has(timestamp)) continue;
      const nextIndex = estimates.findIndex((point) => point.date.getTime() >= timestamp);
      if (nextIndex <= 0) continue;
      const previous = estimates[nextIndex - 1];
      const next = estimates[nextIndex];
      const progress = (timestamp - previous.date.getTime()) / (next.date.getTime() - previous.date.getTime());
      const row = { ...previous, date: labPoint.date };
      for (const method of METHOD_SERIES) {
        const start = previous[method.key];
        const end = next[method.key];
        const value = start == null || end == null ? null : start + (end - start) * progress;
        if (method.key === "current") row.current = value ?? previous.current;
        else row[method.key] = value;
      }
      rows.set(timestamp, row);
    }
    return [...rows.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  });
  async function addLabResult() {
    const value = Number(newLabValue);
    if (!newLabDate || !newLabValue || Number.isNaN(value)) return;
    savingLabResult = true;
    labResultError = null;
    try {
      await labResultsApi.create({
        measuredAt: new Date(`${newLabDate}T00:00:00.000Z`).toISOString(),
        valuePercent: toPercentFromDisplayUnit(value),
        note: newLabNote || undefined,
      });
      labResults = (await labResultsApi.getAll().run()) ?? [];
      newLabDate = "";
      newLabValue = "";
      newLabNote = "";
    } catch (err) {
      labResultError = describeSubmitError(err, "Failed to save lab result");
    } finally {
      savingLabResult = false;
    }
  }

  async function confirmDeleteLabResult() {
    const target = pendingDeleteLabResult;
    pendingDeleteLabResult = null;
    if (!target?.id) return;
    try {
      await labResultsApi.remove(target.id);
      labResults = (await labResultsApi.getAll().run()) ?? [];
    } catch (err) {
      labResultError = describeSubmitError(err, "Failed to delete lab result");
    }
  }

  onMount(() => {
    queueMicrotask(loadAll);
  });
</script>

<div class="@container space-y-6">
  <Card.Root>
    <Card.Header class="flex flex-row flex-wrap items-start justify-between gap-4">
      <div>
        <Card.Title class="flex items-center gap-2">
          <Activity class="h-5 w-5 text-muted-foreground" />
          Estimated HbA1c (eHbA1c)
        </Card.Title>
        <Card.Description>
          Experimental comparison of six glucose-derived estimates. Five alternatives are plotted
          beside the current smooth 90-day method; saved lab results remain independent triangle
          markers and are never used to alter any estimate.
        </Card.Description>
      </div>
      <ToggleGroup.Root
        type="single"
        value={a1cUnit}
        onValueChange={(next: string) => {
          if (next === "percent" || next === "mmol") a1cUnit = next;
        }}
        variant="segmented"
        size="xs"
        class="shrink-0 print:hidden"
      >
        <ToggleGroup.Item value="percent" aria-label="Show as percent">
          %
        </ToggleGroup.Item>
        <ToggleGroup.Item value="mmol" aria-label="Show as mmol/mol">
          mmol/mol
        </ToggleGroup.Item>
      </ToggleGroup.Root>
      <p class="hidden shrink-0 text-sm text-muted-foreground print:block">
        {a1cUnit === "percent" ? "Shown in % (NGSP)" : "Shown in mmol/mol (IFCC)"}
      </p>
    </Card.Header>
    <Card.Content>
      {#if loading}
        <div class="flex h-[320px] items-center justify-center text-muted-foreground">
          <Loader2 class="h-5 w-5 animate-spin mr-2" /> Loading eHbA1c timeline...
        </div>
      {:else if error}
        <div class="flex h-[320px] items-center justify-center text-destructive">
          Failed to load eHbA1c data. Please try again later.
        </div>
      {:else if chartData.length === 0}
        <div class="flex h-[320px] items-center justify-center text-muted-foreground">
          Not enough glucose history yet — each point needs at least a month of readings within
          the trailing 90 days.
        </div>
      {:else}
        {#if latest && extremes}
          <div class="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <div>
              <span class="text-3xl font-semibold tabular-nums">{formatA1c(latest.estimatedA1cPercent)}</span>
              <span class="ml-2 text-sm text-muted-foreground">
                latest estimate ({formatLongDate(latest.date)})
              </span>
            </div>
            <div class="text-sm text-muted-foreground">
              Weighted mean glucose: {bg(latest.weightedAverageGlucoseMgdl)} {bgLabel()}
            </div>
            <div class="text-sm text-muted-foreground">
              Highest: <span class="font-medium text-foreground">{formatA1c(extremes.highest.estimatedA1cPercent)}</span>
              ({formatLongDate(extremes.highest.date)})
            </div>
            <div class="text-sm text-muted-foreground">
              Lowest: <span class="font-medium text-foreground">{formatA1c(extremes.lowest.estimatedA1cPercent)}</span>
              ({formatLongDate(extremes.lowest.date)})
            </div>
          </div>
        {/if}

        <div class="h-[320px] w-full @md:h-[400px]" data-testid="ehba1c-chart">
          <LineChart
            data={displayChartData}
            x="date"
            y="current"
            legend
            {yDomain}
            clip
            series={METHOD_SERIES.map((method) => ({
              key: method.key,
              label: method.label,
              color: method.color,
            }))}
            props={{ spline: { "stroke-width": 3, "stroke-linecap": "round", "data-testid": "ehba1c-line" } }}
            points={{ data: labChartPoints, x: (d) => d.date, y: (d) => d.displayValue, children: labMarkers }}
            {annotations}
          >
            {#snippet tooltip({ context })}
              <Tooltip.Root {context} class="bg-popover text-popover-foreground rounded-md border p-3 shadow-lg">
                {#snippet children({ data })}
                  {@const hoveredDate = context.x(data)}
                  {@const hoveredDateKey = dateKey(hoveredDate)}
                  {@const eHbA1cPoint = chartData.find((point) => dateKey(point.date) === hoveredDateKey)}
                  {@const labResultsForDate = labChartPoints.filter((point) => dateKey(point.date) === hoveredDateKey)}
                  <div class="mb-2 text-sm font-semibold">{formatLongDate(hoveredDate)}</div>
                  <div class="min-w-56 space-y-1.5 text-sm" data-testid="ehba1c-tooltip">
                    {#if eHbA1cPoint}
                      <div class="grid grid-cols-[1fr_auto] items-center gap-x-4">
                        <span class="flex min-w-0 items-center gap-2 text-muted-foreground">
                          <span class="h-2 w-2 shrink-0 rounded-full bg-(--ehba1c-line)"></span>
                          <span>eHbA1c</span>
                        </span>
                        <span class="font-mono font-medium tabular-nums">{formatDisplayValue(toDisplayUnit(eHbA1cPoint.estimatedA1cPercent))}</span>
                      </div>
                    {/if}
                    {#each labResultsForDate as labResult (labResult.id)}
                      <div class="grid grid-cols-[1fr_auto] items-center gap-x-4">
                        <span class="flex min-w-0 items-center gap-2 text-muted-foreground">
                          <span class="h-0 w-0 shrink-0 border-x-4 border-b-8 border-x-transparent border-b-foreground"></span>
                          <span>Lab result</span>
                        </span>
                        <span class="font-mono font-medium tabular-nums">{formatA1c(labResult.valuePercent)}</span>
                        {#if labResult.note}
                          <span class="col-span-2 truncate text-xs text-muted-foreground">{labResult.note}</span>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/snippet}
              </Tooltip.Root>
            {/snippet}
          </LineChart>
        </div>

        <div class="mt-4 grid gap-2 text-sm text-muted-foreground @md:grid-cols-2">
          <p><strong class="text-foreground">Current smooth 90-day:</strong> existing ADAG estimate; smooth decay calibrated so the newest 30 days contribute about half.</p>
          <p><strong class="text-foreground">Linear 90-to-1:</strong> today has weight 90, yesterday 89, down to weight 1 for the oldest day in the 90-day window.</p>
          <p><strong class="text-foreground">30-day half-life:</strong> exponential decay; a reading's weight halves every 30 days.</p>
          <p><strong class="text-foreground">Unweighted 90-day:</strong> every reading in the trailing 90 days contributes equally; converted with ADAG.</p>
          <p><strong class="text-foreground">120-day 50/25/25:</strong> a common clinical approximation: 50% emphasis on days 0–29, 25% on days 30–59, and 25% on days 60–119; converted with ADAG.</p>
          <p><strong class="text-foreground">Unweighted 14-day:</strong> the same ADAG conversion as the 90-day line, but over only 14 days. It should cross the 90-day line after a trend reversal and converge during a stable period.</p>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <ChartKey
            class="text-sm text-foreground"
            items={zoneBands.map((band) => ({
              texture: band.texture,
              color: band.swatch,
              label: `${band.label} (${formatZoneRange(band)})`,
            }))}
          />
          {#if labChartPoints.length > 0}
            <div class="flex items-center gap-1.5">
              <span class="inline-block h-0 w-0 border-x-4 border-b-7 border-x-transparent border-b-foreground"
              ></span>
              <span>Lab result (not included in the calculation)</span>
            </div>
          {/if}
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <Card.Root class={labResults.length === 0 ? "print:hidden" : undefined}>
    <Card.Header>
      <Card.Title>Lab results</Card.Title>
      <p class="hidden text-sm text-muted-foreground print:block">
        Lab HbA1c draws, shown as triangles on the chart above. They are not included in the
        eHbA1c calculation.
      </p>
      <Card.Description class="print:hidden">
        Enter a lab HbA1c result here — shown as a triangle marker on the chart above, so you
        can see how closely the eHbA1c estimate tracks an actual lab draw. Lab results are not
        included in the eHbA1c calculation itself. The date below is the date the blood was
        drawn, not the date you enter it here.
      </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
      {#if labResults.length === 0}
        <p class="text-sm text-muted-foreground">No lab results added yet.</p>
      {:else}
        <ul class="divide-border divide-y">
          {#each [...labResults].sort((a, b) => toDate(b.measuredAt).getTime() - toDate(a.measuredAt).getTime()) as result (result.id)}
            <li class="flex items-center justify-between gap-3 py-2">
              <div>
                <div class="text-sm font-medium">
                  {formatA1c(result.valuePercent ?? 0)}
                  {#if result.note}<span class="text-muted-foreground font-normal"> — {result.note}</span>{/if}
                </div>
                <div class="text-xs text-muted-foreground">
                  {formatLongDate(toDate(result.measuredAt))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                class="print:hidden"
                aria-label="Delete lab result"
                onclick={() => (pendingDeleteLabResult = result)}
              >
                <Trash2 class="size-4" />
              </Button>
            </li>
          {/each}
        </ul>
      {/if}

      <div class="grid gap-3 sm:grid-cols-3 print:hidden">
        <div class="space-y-1.5">
          <Label for="lab-date">Date of blood draw</Label>
          <Input id="lab-date" type="date" bind:value={newLabDate} />
        </div>
        <div class="space-y-1.5">
          <Label for="lab-value">Result ({a1cUnit === "percent" ? "%" : "mmol/mol"})</Label>
          <Input id="lab-value" type="number" step="0.1" bind:value={newLabValue} placeholder={a1cUnit === "percent" ? "e.g. 7.0" : "e.g. 53"} />
        </div>
        <div class="space-y-1.5">
          <Label for="lab-note">Note (optional)</Label>
          <Input id="lab-note" type="text" bind:value={newLabNote} placeholder="e.g. GP lab" />
        </div>
      </div>

      {#if labResultError}
        <p class="text-destructive text-sm print:hidden">{labResultError}</p>
      {/if}

      <Button
        class="print:hidden"
        onclick={addLabResult}
        disabled={savingLabResult || !newLabDate || !newLabValue}
      >
        {#if savingLabResult}
          <Loader2 class="size-4 animate-spin" />
        {:else}
          <Plus class="size-4" />
        {/if}
        Add lab result
      </Button>
    </Card.Content>
  </Card.Root>
</div>

{#snippet labMarkers({ points }: { points: { x: number; y: number; data: (typeof labChartPoints)[number] }[] })}
  {#each points as point (point.data.id)}
    <polygon
      data-testid="lab-marker"
      points="{point.x},{point.y - 7} {point.x - 6},{point.y + 5} {point.x + 6},{point.y + 5}"
      class="fill-foreground stroke-background"
      stroke-width="1"
      pointer-events="none"
    >
      <title>Lab result: {formatA1c(point.data.valuePercent)} ({formatLongDate(point.data.date)}){point.data.note ? ` — ${point.data.note}` : ""}</title>
    </polygon>
  {/each}
{/snippet}

<ConfirmDialog
  open={pendingDeleteLabResult !== null}
  onOpenChange={(o) => { if (!o) pendingDeleteLabResult = null; }}
  title="Delete this lab result?"
  confirmLabel="Delete"
  onConfirm={confirmDeleteLabResult}
>
  {#snippet description()}
    {#if pendingDeleteLabResult}
      Delete the {formatA1c(pendingDeleteLabResult.valuePercent ?? 0)} lab result from
      {formatLongDate(toDate(pendingDeleteLabResult.measuredAt))}.
    {/if}
  {/snippet}
</ConfirmDialog>
