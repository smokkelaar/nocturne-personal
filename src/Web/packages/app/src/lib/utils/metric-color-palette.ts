import type { RampStop } from "./metric-color-focus";

export const MAX_PALETTE_COLORS = 8;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * A palette that replaces a metric's theme ramp, and whether the ramp runs high
 * to low.
 */
export type RampLook = {
  readonly palette?: readonly string[];
  readonly mirror?: boolean;
};

// Approximate stops for each colormap (https://sjmgarnier.github.io/viridis/articles/intro-to-viridis.html),
// sampled so the picker previews and the scale both show the full spectrum.
export const COLOR_PALETTES: readonly {
  label: string;
  colors: readonly string[];
}[] = [
  {
    label: "Viridis",
    colors: ["#440154", "#3b528b", "#21908d", "#5dc963", "#fde725"],
  },
  {
    label: "Plasma",
    colors: ["#0d0887", "#7e03a8", "#cc4778", "#f89441", "#f0f921"],
  },
  {
    label: "Inferno",
    colors: ["#000004", "#57106e", "#bc3754", "#f98c0a", "#fcffa4"],
  },
  {
    label: "Magma",
    colors: ["#000004", "#51127c", "#b73779", "#fc8961", "#fcfdbf"],
  },
  {
    label: "Cividis",
    colors: ["#00204d", "#414d6b", "#7c7b78", "#b6a069", "#ffe945"],
  },
  {
    label: "Turbo",
    colors: ["#30123b", "#4675ed", "#1ae4b6", "#a4fc3c", "#fb8022", "#7a0403"],
  },
  {
    label: "Mako",
    colors: ["#0b0405", "#35264c", "#2f6b8e", "#52c2ac", "#dbf6d7"],
  },
  {
    label: "Rocket",
    colors: ["#03051a", "#521635", "#a52c60", "#f2703a", "#fbeae3"],
  },
];

/** Two to {@link MAX_PALETTE_COLORS} hex colors, or null. */
export function resolvePalette(candidate: unknown): string[] | null {
  return Array.isArray(candidate) &&
    candidate.length >= 2 &&
    candidate.length <= MAX_PALETTE_COLORS &&
    candidate.every(
      (color) => typeof color === "string" && HEX_COLOR.test(color)
    )
    ? [...candidate]
    : null;
}

export function samePalette(
  a: readonly string[] | undefined,
  b: readonly string[] | undefined
) {
  return (
    !!a &&
    !!b &&
    a.length === b.length &&
    a.every((color, i) => color.toLowerCase() === b[i].toLowerCase())
  );
}

/**
 * The ramp a scale paints its end and boundary colors over: the palette spread
 * evenly in place of `theme`, reversed when mirrored.
 */
export function lookRamp(
  theme: readonly RampStop[],
  look: RampLook
): readonly RampStop[] {
  const palette = resolvePalette(look.palette);
  const base = palette
    ? palette.map((color, i) => ({ position: i / (palette.length - 1), color }))
    : theme;
  if (!look.mirror) return base;
  return base
    .map(({ position, color }) => ({ position: 1 - position, color }))
    .reverse();
}

/** A diagonal preview swatch spanning every stop of a palette. */
export function paletteSwatchGradient(colors: readonly string[]): string {
  return `linear-gradient(135deg, ${colors.join(", ")})`;
}
