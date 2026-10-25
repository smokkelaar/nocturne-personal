import { describe, expect, it } from "vitest";
import {
  glucoseScale,
  intensityScale,
  metricRamp,
  scaleColor,
  GLUCOSE_RAMP,
} from "./metric-color-focus";
import {
  lookRamp,
  resolvePalette,
  samePalette,
  MAX_PALETTE_COLORS,
} from "./metric-color-palette";

describe("resolvePalette", () => {
  it("keeps two to eight hex colors", () => {
    expect(resolvePalette(["#000000", "#FFFFFF"])).toEqual([
      "#000000",
      "#FFFFFF",
    ]);
    expect(
      resolvePalette(Array(MAX_PALETTE_COLORS).fill("#123456"))
    ).toHaveLength(MAX_PALETTE_COLORS);
  });

  it.each([
    [undefined],
    [[]],
    [["#000000"]],
    [["#000", "#fff"]],
    [["#000000", "red"]],
    [Array(MAX_PALETTE_COLORS + 1).fill("#123456")],
  ])("drops %j", (candidate) => {
    expect(resolvePalette(candidate)).toBeNull();
  });
});

describe("lookRamp", () => {
  it("leaves the theme ramp alone without a look", () => {
    expect(lookRamp(GLUCOSE_RAMP, {})).toBe(GLUCOSE_RAMP);
  });

  it("spreads a palette evenly", () => {
    expect(
      lookRamp(GLUCOSE_RAMP, { palette: ["#000000", "#808080", "#ffffff"] })
    ).toEqual([
      { position: 0, color: "#000000" },
      { position: 0.5, color: "#808080" },
      { position: 1, color: "#ffffff" },
    ]);
  });

  it("mirrors a palette and the theme ramp", () => {
    expect(
      lookRamp(GLUCOSE_RAMP, { palette: ["#000000", "#ffffff"], mirror: true })
    ).toEqual([
      { position: 0, color: "#ffffff" },
      { position: 1, color: "#000000" },
    ]);
    const mirrored = lookRamp(metricRamp("--carbs"), { mirror: true });
    expect(mirrored[0].color).toBe("var(--carbs)");
    expect(mirrored.at(-1)!.position).toBe(1);
  });
});

describe("scales with a look", () => {
  it("draw the palette, and end colors still win", () => {
    const palette = ["#000000", "#ffffff"];
    expect(scaleColor(40, glucoseScale(null, null, 90, {}, { palette }))).toBe(
      "#000000"
    );
    expect(
      scaleColor(
        350,
        glucoseScale(null, null, 90, {}, { palette, mirror: true })
      )
    ).toBe("#000000");
    const scale = intensityScale(
      "--carbs",
      [0, Infinity],
      100,
      null,
      null,
      90,
      { high: "#ff0000" },
      { palette }
    );
    expect(scaleColor(0, scale)).toBe("#000000");
    expect(scaleColor(100, scale)).toBe("#ff0000");
  });
});

it("compares palettes ignoring case", () => {
  expect(samePalette(["#ABCDEF", "#000000"], ["#abcdef", "#000000"])).toBe(
    true
  );
  expect(samePalette(undefined, ["#abcdef"])).toBe(false);
});
