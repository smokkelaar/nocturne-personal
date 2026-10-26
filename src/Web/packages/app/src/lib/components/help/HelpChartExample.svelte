<script lang="ts">
  import { AmbulatoryGlucoseProfile } from "$lib/components/ambulatory-glucose-profile";
  import { Button } from "$lib/components/ui/button";
  import TimeOfDayPanel from "$lib/components/reports/loop-analysis/TimeOfDayPanel.svelte";
  import PercentileBands from "$lib/components/reports/loop-analysis/PercentileBands.svelte";
  import SlotBars from "$lib/components/reports/loop-analysis/SlotBars.svelte";
  import HorizonErrorChart from "$lib/components/reports/loop-analysis/HorizonErrorChart.svelte";
  import ScheduledBasalRateChart from "$lib/components/reports/ScheduledBasalRateChart.svelte";
  import PairedGlucoseScatter from "$lib/components/reports/cgm-comparison/PairedGlucoseScatter.svelte";
  import SleepCompositionChart from "$lib/components/reports/sleep/SleepCompositionChart.svelte";
  import { GLUCOSE_BANDS } from "$lib/components/reports/percentile-band-colors";
  import { TimeOfDayCursor } from "$lib/components/reports/loop-analysis/time-of-day-cursor.svelte";
  import { PredictionCurve } from "$lib/api";
  import { bg, bgValue, bgLabel, bgDelta } from "$lib/utils/formatting";
  import {
    aggregates,
    averagedStats,
    compared,
    bars,
    comparedBars,
    prediction,
    schedule,
    pairs,
    nights,
    sleepDays,
    type ChartExampleKind,
  } from "$lib/help/chart-examples";
  import { chartLessons } from "$lib/help/chart-lessons.svelte";
  let { kind }: { kind: ChartExampleKind } = $props();
  const lessons = $derived(chartLessons());
  type Topic = keyof ReturnType<typeof chartLessons>;
  const initial = $derived(
    (
      {
        agp: "median",
        bands: "median",
        bars: "bars",
        prediction: "prediction",
        scatter: "scatter",
        schedule: "schedule",
        sleep: "sleep",
      } as const
    )[kind]
  );
  let topic = $state<Topic | null>(null);
  let scenario = $state<"complete" | "gap" | "comparison">("complete");
  const selected = $derived(lessons[topic ?? initial]);
  const showBars = $derived(
    kind === "bars" || topic === "bars" || topic === "barComparison"
  );
  const cursor = new TimeOfDayCursor(8);
  const slots = $derived(
    aggregates.map((value, i) => ({
      value: scenario === "gap" && (i === 3 || i === 4) ? undefined : value,
    }))
  );
  const comparison = $derived(
    scenario === "comparison" ? compared.map((value) => ({ value })) : null
  );
  const shownPrediction = $derived(
    scenario === "gap"
      ? {
          ...prediction,
          horizons: prediction.horizons?.map((h, i) =>
            i === 1 ? { minutes: h.minutes, unmatched: 95 } : h
          ),
        }
      : prediction
  );
  const shownNights = $derived(
    scenario === "gap" ? nights.filter((_, i) => i !== 3) : nights
  );
  function choose(next: Topic) {
    topic = next;
    if (next === "gap") scenario = "gap";
    else if (next === "comparison" || next === "barComparison")
      scenario = "comparison";
    else scenario = "complete";
    cursor.slot = null;
    cursor.selected = null;
  }
  const topics = $derived<Topic[]>(
    kind === "bands"
      ? ["median", "gap", "comparison", "bars", "barComparison"]
      : showBars
        ? ["bars", "barComparison"]
        : [initial]
  );
  const slotLabel = (slot: number) =>
    `${String(slot * 3).padStart(2, "0")}:00–${String((slot + 1) * 3).padStart(2, "0")}:00`;
  const noData = () => "No data in this example slot";
  function describe(slot: number): string {
    if (showBars) return `${bars[slot]?.value ?? 0} U per day`;
    const a = slots[slot]?.value;
    return a ? `${bg(a.p50 ?? 0)} ${bgLabel()}, n=${a.n}` : noData();
  }
</script>

<section
  class="space-y-4 rounded-xl border bg-card p-4 text-card-foreground"
  aria-label="Interactive chart example"
>
  <div class="space-y-1">
    <h3 class="font-semibold">Explore the chart</h3>
    <p class="text-sm text-muted-foreground">
      Fictional example data. The chart uses the same components, theme colours
      and display units as the report.
    </p>
  </div>
  <div class="flex flex-wrap gap-2" aria-label="Chart explanations">
    {#each topics as key (key)}
      <Button
        variant={(topic ?? initial) === key ? "secondary" : "outline"}
        size="sm"
        aria-pressed={(topic ?? initial) === key}
        onclick={() => choose(key)}
      >
        {lessons[key].title}
      </Button>
    {/each}
  </div>
  {#if kind === "prediction" || kind === "sleep"}
    <div class="flex flex-wrap gap-2">
      <Button
        variant={scenario === "complete" ? "secondary" : "outline"}
        size="sm"
        aria-pressed={scenario === "complete"}
        onclick={() => (scenario = "complete")}
      >
        Complete example
      </Button>
      <Button
        variant={scenario === "gap" ? "secondary" : "outline"}
        size="sm"
        aria-pressed={scenario === "gap"}
        onclick={() => (scenario = "gap")}
      >
        Missing records
      </Button>
    </div>
  {/if}
  <div class="min-w-0 pb-3" data-example-chart={kind}>
    {#if kind === "agp"}
      <div class="h-80"><AmbulatoryGlucoseProfile {averagedStats} /></div>
    {:else if kind === "bands" || kind === "bars"}
      <TimeOfDayPanel
        id="help-chart"
        title={selected.title}
        unit={showBars ? "U per day" : bgLabel()}
        {cursor}
        yDomain={showBars ? [0, 6] : [bgValue(60), bgValue(220)]}
        showTimeAxis
        heightClass="h-52"
        ticks={[0, 2, 4, 6, 8]}
        tickLabel={(slot) => `${slot * 3}:00`}
        {slotLabel}
        {describe}
      >
        {#snippet marks()}
          {#if !showBars}
            <PercentileBands
              {slots}
              {comparison}
              pick={(slot) => slot.value}
              scale={bgValue}
              outerColor={GLUCOSE_BANDS.outer}
              innerColor={GLUCOSE_BANDS.inner}
              lineColor={GLUCOSE_BANDS.median}
            />
          {:else}
            <SlotBars
              {bars}
              comparison={scenario === "comparison" ? comparedBars : []}
              color="var(--insulin-bolus)"
            />
          {/if}
        {/snippet}
        {#snippet tooltip(slot)}
          <p>{describe(slot)}</p>
          {#if !showBars && slots[slot]?.value}
            <p>
              P25–P75: {bg(slots[slot].value?.p25 ?? 0)}–{bg(
                slots[slot].value?.p75 ?? 0
              )}
              {bgLabel()}
            </p>
          {/if}
          {#if scenario === "comparison"}<p>
              {selected.title}: {showBars
                ? `${comparedBars[slot]?.value} U`
                : `${bg(compared[slot]?.p50 ?? 0)} ${bgLabel()}`}
            </p>{/if}
        {/snippet}
      </TimeOfDayPanel>
      <p class="mt-3 text-xs text-muted-foreground">
        Point to a time slot, or focus the chart and use the arrow keys. Click
        or press Enter to keep a selection.
      </p>
      {#if cursor.selected != null}<p class="mt-2 text-sm" role="status">
          {slotLabel(cursor.selected)}: {describe(cursor.selected)}
        </p>{/if}
    {:else if kind === "prediction"}
      <HorizonErrorChart
        kind={PredictionCurve.Default}
        curve={shownPrediction}
        color="var(--chart-1)"
        yDomain={[bgValue(-60), bgValue(70)]}
        scale={bgValue}
        formatError={(v) => bgDelta(v)}
        formatMae={(v) => String(bg(v))}
        unit={bgLabel()}
      />
      <p class="mt-3 text-xs text-muted-foreground">
        Point to a horizon or use the arrow keys to inspect bias, MAE and the
        number of matched predictions.
      </p>
    {:else if kind === "schedule"}
      <p class="text-xs text-muted-foreground">
        Scheduled rate (U/h), 00:00–23:00
      </p>
      <div class="h-52"><ScheduledBasalRateChart entries={schedule} /></div>
    {:else if kind === "scatter"}
      <PairedGlucoseScatter {pairs} nameA="A" nameB="B" />
    {:else if kind === "sleep"}
      <SleepCompositionChart
        nights={shownNights}
        days={sleepDays}
        onSelectNight={() => (topic = "sleep")}
      />
    {/if}
  </div>
  <div
    class="space-y-2 rounded-lg border bg-muted/30 p-4"
    aria-live="polite"
    aria-atomic="true"
  >
    <h4 class="font-medium">{selected.title}</h4>
    <p class="text-sm leading-relaxed">{selected.meaning}</p>
    <p class="text-sm leading-relaxed text-muted-foreground">
      {selected.check}
    </p>
  </div>
  <p class="text-xs text-muted-foreground">
    These controls only change the example. Your records and saved settings stay
    the same.
  </p>
</section>
