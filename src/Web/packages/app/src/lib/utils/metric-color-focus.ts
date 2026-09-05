export type ColorFocusRange = readonly [number, number];

export const COLOR_FOCUS_METRICS = [
  "tir",
  "bolus",
  "basal",
  "tdd",
  "carbs",
] as const;
export type ColorFocusMetric = (typeof COLOR_FOCUS_METRICS)[number];
export type ColorFocusPreferences = Partial<
  Record<ColorFocusMetric, ColorFocusRange>
>;

export function resolveColorFocusRange(
  candidate: unknown
): ColorFocusRange | null {
  if (!Array.isArray(candidate) || candidate.length !== 2) return null;
  const [min, max] = candidate;
  return typeof min === "number" &&
    typeof max === "number" &&
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    min >= 0 &&
    max > min
    ? [min, max]
    : null;
}

export function parseColorFocusPreferences(
  raw: string | null
): ColorFocusPreferences {
  try {
    const parsed: unknown = JSON.parse(raw ?? "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    const preferences: ColorFocusPreferences = {};
    for (const metric of COLOR_FOCUS_METRICS) {
      const range = resolveColorFocusRange(
        (parsed as Record<string, unknown>)[metric]
      );
      if (range && (metric !== "tir" || range[1] <= 100))
        preferences[metric] = range;
    }
    return preferences;
  } catch {
    return {};
  }
}

export function getFocusedIntensityFill(
  value: number,
  range: ColorFocusRange,
  cssVar: string
): string {
  const [min, max] = resolveColorFocusRange(range) ?? [0, 1];
  const intensity = Number.isFinite(value)
    ? Math.max(0, Math.min((value - min) / (max - min), 1))
    : 0;
  return `color-mix(in srgb, var(${cssVar}) ${Math.round(15 + intensity * 85)}%, transparent)`;
}

export function colorFocusGradient(
  range: ColorFocusRange,
  domainMax: number,
  cssVar: string
): string {
  const validRange = resolveColorFocusRange(range) ?? [0, 1];
  const domain = Math.max(
    Number.isFinite(domainMax) ? domainMax : 1,
    validRange[1]
  );
  const low = getFocusedIntensityFill(validRange[0], validRange, cssVar);
  const high = getFocusedIntensityFill(validRange[1], validRange, cssVar);
  return `linear-gradient(to right, ${low} 0%, ${low} ${(validRange[0] / domain) * 100}%, ${high} ${(validRange[1] / domain) * 100}%, ${high} 100%)`;
}
