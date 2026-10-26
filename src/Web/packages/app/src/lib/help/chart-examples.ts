import type {
  LoopAnalysisAggregate,
  PredictionCurveAccuracy,
  CgmPairedReading,
  ScheduleEntry,
  SleepNightSummary,
} from "$lib/api";
import { PredictionCurve } from "$lib/api";
import type { SlotBar } from "$lib/components/reports/loop-analysis/SlotBars.svelte";

// Fictional, precomputed values. These fixtures never read patient data or derive clinical statistics.
export const aggregates: LoopAnalysisAggregate[] = [
  { p10: 80, p25: 95, p50: 115, p75: 135, p90: 155, n: 28 },
  { p10: 85, p25: 100, p50: 120, p75: 145, p90: 165, n: 28 },
  { p10: 90, p25: 110, p50: 135, p75: 160, p90: 185, n: 28 },
  { p10: 95, p25: 115, p50: 145, p75: 175, p90: 200, n: 28 },
  { p10: 90, p25: 110, p50: 130, p75: 155, p90: 180, n: 28 },
  { p10: 80, p25: 95, p50: 115, p75: 140, p90: 165, n: 28 },
  { p10: 75, p25: 90, p50: 110, p75: 130, p90: 150, n: 28 },
  { p10: 80, p25: 95, p50: 120, p75: 145, p90: 170, n: 28 },
];
export const compared: LoopAnalysisAggregate[] = [
  { p25: 110, p50: 135, p75: 165 },
  { p25: 115, p50: 140, p75: 170 },
  { p25: 120, p50: 150, p75: 180 },
  { p25: 125, p50: 155, p75: 185 },
  { p25: 115, p50: 140, p75: 170 },
  { p25: 100, p50: 125, p75: 155 },
  { p25: 95, p50: 120, p75: 145 },
  { p25: 105, p50: 130, p75: 160 },
];
export const bars: SlotBar[] = [2, 3, 5, 4, 3, 1, 2, 4].map((value, start) => ({
  start,
  end: start + 1,
  value,
}));
export const comparedBars: SlotBar[] = [3, 2, 4, 5, 2, 2, 3, 3].map(
  (value, start) => ({ start, end: start + 1, value })
);
export const prediction: PredictionCurveAccuracy = {
  curve: PredictionCurve.Default,
  horizons: [
    {
      minutes: 15,
      error: { p10: -15, p25: -7, p50: 0, p75: 7, p90: 15, mean: 1, n: 120 },
      mae: 8,
    },
    {
      minutes: 30,
      error: { p10: -25, p25: -12, p50: 3, p75: 18, p90: 35, mean: 5, n: 95 },
      mae: 15,
    },
    {
      minutes: 60,
      error: { p10: -40, p25: -20, p50: 8, p75: 30, p90: 55, mean: 10, n: 42 },
      mae: 24,
    },
  ],
};
export const pairs: CgmPairedReading[] = [
  { mgdlA: 85, mgdlB: 90 },
  { mgdlA: 115, mgdlB: 110 },
  { mgdlA: 140, mgdlB: 150 },
  { mgdlA: 175, mgdlB: 165 },
  { mgdlA: 205, mgdlB: 210 },
  { mgdlA: 255, mgdlB: 240 },
];
export const schedule: ScheduleEntry[] = [
  { time: "00:00", value: 0.7 },
  { time: "06:00", value: 0.9 },
  { time: "12:00", value: 0.8 },
  { time: "18:00", value: 0.6 },
  { time: "23:00", value: 0.6 },
];
export const sleepDays = Array.from(
  { length: 7 },
  (_, i) => `2024-01-0${i + 1}`
);
export const nights: SleepNightSummary[] = sleepDays.map((day, i) => ({
  sessionId: `help-night-${i}`,
  displayDate: day,
  inBedAt: new Date(`${day}T23:00:00`).toISOString(),
  deepMinutes: 60,
  remMinutes: 90,
  lightMinutes: 270,
  awakeMinutes: 20,
}));

// Only pages using these chart families get the matching sandbox. A sleep timeline, for example,
// must not be illustrated by the composition chart from the trends page.
export type ChartExampleKind =
  | "agp"
  | "bands"
  | "bars"
  | "prediction"
  | "scatter"
  | "schedule"
  | "sleep";
export function chartExampleKind(path: string): ChartExampleKind | null {
  switch (path) {
    case "/reports/agp":
      return "agp";
    case "/reports/loop-analysis/daily-profile":
      return "bands";

    case "/reports/loop-analysis/prediction-accuracy":
      return "prediction";
    case "/reports/data-quality/cgm-comparison":
      return "scatter";
    case "/reports/idp":
      return "schedule";
    case "/reports/sleep":
      return "sleep";
    default:
      return null;
  }
}

export const averagedStats = aggregates.map((a, i) => ({
  hour: i * 3,
  median: a.p50,
  percentiles: { p10: a.p10, p25: a.p25, p75: a.p75, p90: a.p90 },
  dayCount: 28,
}));
