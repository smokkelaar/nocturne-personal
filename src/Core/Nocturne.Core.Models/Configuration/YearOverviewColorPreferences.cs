using System.Text.RegularExpressions;

namespace Nocturne.Core.Models.Configuration;

/// <summary>
/// The year overview's color scale for each metric: a focus window, outside which days are
/// dimmed by <see cref="OutOfBandTransparency"/>, the color boundaries that warp the
/// metric's color ramp, and the colors chosen for the ramp's low and high ends. A color is
/// <c>#rrggbb</c>; an unset one keeps the theme color. A palette replaces the theme ramp
/// with its colors spread evenly from low to high, and mirroring reverses the ramp before
/// the end and boundary colors are painted over it.
/// Personal: the color range places the ramp's low and high ends, apart from the focus window,
/// so dimming and coloring are set independently.
/// </summary>
public partial class YearOverviewColorPreferences
{
    internal const int MaxBoundaries = 16;
    internal const int MaxPaletteColors = 8;
    private const double GlucoseMin = 40;
    private const double GlucoseMax = 350;

    public double? OutOfBandTransparency { get; set; }

    public double[]? AvgGlucoseBand { get; set; }
    public YearOverviewColorBoundary[]? AvgGlucoseBoundaries { get; set; }
    public string? AvgGlucoseLowColor { get; set; }
    public string? AvgGlucoseHighColor { get; set; }
    public string[]? AvgGlucosePalette { get; set; }
    public bool? AvgGlucoseMirror { get; set; }
    public double[]? AvgGlucoseColorRange { get; set; }
    public double[]? TirBand { get; set; }
    public YearOverviewColorBoundary[]? TirBoundaries { get; set; }
    public string? TirLowColor { get; set; }
    public string? TirHighColor { get; set; }
    public string[]? TirPalette { get; set; }
    public bool? TirMirror { get; set; }
    public double[]? TirColorRange { get; set; }
    public double[]? BolusBand { get; set; }
    public YearOverviewColorBoundary[]? BolusBoundaries { get; set; }
    public string? BolusLowColor { get; set; }
    public string? BolusHighColor { get; set; }
    public string[]? BolusPalette { get; set; }
    public bool? BolusMirror { get; set; }
    public double[]? BolusColorRange { get; set; }
    public double[]? BasalBand { get; set; }
    public YearOverviewColorBoundary[]? BasalBoundaries { get; set; }
    public string? BasalLowColor { get; set; }
    public string? BasalHighColor { get; set; }
    public string[]? BasalPalette { get; set; }
    public bool? BasalMirror { get; set; }
    public double[]? BasalColorRange { get; set; }
    public double[]? TddBand { get; set; }
    public YearOverviewColorBoundary[]? TddBoundaries { get; set; }
    public string? TddLowColor { get; set; }
    public string? TddHighColor { get; set; }
    public string[]? TddPalette { get; set; }
    public bool? TddMirror { get; set; }
    public double[]? TddColorRange { get; set; }
    public double[]? CarbsBand { get; set; }
    public YearOverviewColorBoundary[]? CarbsBoundaries { get; set; }
    public string? CarbsLowColor { get; set; }
    public string? CarbsHighColor { get; set; }
    public string[]? CarbsPalette { get; set; }
    public bool? CarbsMirror { get; set; }
    public double[]? CarbsColorRange { get; set; }

    public string? Validate()
    {
        if (OutOfBandTransparency.HasValue && (OutOfBandTransparency.Value < 0 || OutOfBandTransparency.Value > 100))
        {
            return "yearOverviewColors.outOfBandTransparency: invalid_transparency_value";
        }

        foreach (var (metric, band, range, boundaries, low, high, palette, min, max) in new[]
        {
            ("avgGlucose", AvgGlucoseBand, AvgGlucoseColorRange, AvgGlucoseBoundaries, AvgGlucoseLowColor, AvgGlucoseHighColor, AvgGlucosePalette, GlucoseMin, GlucoseMax),
            ("tir", TirBand, TirColorRange, TirBoundaries, TirLowColor, TirHighColor, TirPalette, 0d, 100d),
            ("bolus", BolusBand, BolusColorRange, BolusBoundaries, BolusLowColor, BolusHighColor, BolusPalette, 0d, double.PositiveInfinity),
            ("basal", BasalBand, BasalColorRange, BasalBoundaries, BasalLowColor, BasalHighColor, BasalPalette, 0d, double.PositiveInfinity),
            ("tdd", TddBand, TddColorRange, TddBoundaries, TddLowColor, TddHighColor, TddPalette, 0d, double.PositiveInfinity),
            ("carbs", CarbsBand, CarbsColorRange, CarbsBoundaries, CarbsLowColor, CarbsHighColor, CarbsPalette, 0d, double.PositiveInfinity),
        })
        {
            if (!IsColorOrUnset(low) || !IsColorOrUnset(high))
            {
                return $"yearOverviewColors.{metric}Colors: invalid_color";
            }

            if (palette is not null
                && (palette.Length < 2
                    || palette.Length > MaxPaletteColors
                    || !palette.All(color => color is not null && HexColor().IsMatch(color))))
            {
                return $"yearOverviewColors.{metric}Palette: invalid_palette";
            }

            if (!IsRangeOrUnset(band, min, max))
            {
                return $"yearOverviewColors.{metric}Band: invalid_color_range";
            }

            if (!IsRangeOrUnset(range, min, max))
            {
                return $"yearOverviewColors.{metric}ColorRange: invalid_color_range";
            }

            if (boundaries is not null
                && (boundaries.Length > MaxBoundaries
                    || boundaries.Any(b => b is null
                        || !double.IsFinite(b.Value) || b.Value <= min || b.Value >= max
                        || !double.IsFinite(b.Position) || b.Position <= 0 || b.Position >= 1
                        || !IsColorOrUnset(b.Color))
                    || boundaries.Zip(boundaries.Skip(1)).Any(pair =>
                        pair.First.Value >= pair.Second.Value || pair.First.Position >= pair.Second.Position)))
            {
                return $"yearOverviewColors.{metric}Boundaries: invalid_color_boundaries";
            }
        }
        return null;
    }

    private static bool IsRangeOrUnset(double[]? range, double min, double max) =>
        range is null
        || (range.Length == 2 && range.All(double.IsFinite) && range[0] < range[1] && range[0] >= min && range[1] <= max);

    private static bool IsColorOrUnset(string? color) => color is null || HexColor().IsMatch(color);

    [GeneratedRegex("^#[0-9a-fA-F]{6}$")]
    private static partial Regex HexColor();
}

/// <summary>
/// Pins the point <see cref="Position"/> of the way along a metric's color ramp (0 to 1,
/// exclusive) to <see cref="Value"/>, in the metric's canonical unit (mg/dL for glucose).
/// </summary>
public class YearOverviewColorBoundary
{
    public double Value { get; set; }
    public double Position { get; set; }

    /// <summary>Replaces the ramp's own color at <see cref="Position"/>.</summary>
    public string? Color { get; set; }
}
