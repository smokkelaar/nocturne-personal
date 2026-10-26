export function chartLessons() {
  return {
    median: {
      title: "Median and spread",
      meaning:
        "The solid line is P50, the median. The inner band spans P25–P75; the outer band spans P10–P90.",
      check:
        "Wider bands mean more spread among the recorded values at that time; they are not a forecast.",
    },
    gap: {
      title: "Missing data",
      meaning:
        "Blank sections indicate missing aggregate data for that period, not a value of zero.",
      check:
        "Move across the blank section and compare it with the neighboring time slots.",
    },
    comparison: {
      title: "Comparison period",
      meaning:
        "Dashed lines represent the median and band edges of a second selected period, not forecasts.",
      check:
        "Compare the same time slot in both periods, and check the dates and available records.",
    },
    barComparison: {
      title: "Compare amounts",
      meaning:
        "Dashed outlines show the amount in the second period, over the same time intervals as the filled bars.",
      check:
        "Check both date ranges and their units before comparing bar heights.",
    },
    bars: {
      title: "Amounts and intervals",
      meaning:
        "Bars show values over time from the zero axis, with dashed outlines for comparisons.",
      check:
        "Check the units to identify the quantity, as taller bars do not mean better outcomes.",
    },
    prediction: {
      title: "Prediction error",
      meaning:
        "The chart compares uploaded predictions against later glucose measurements, grouped by prediction horizon.",
      check:
        "Bias is signed; MAE is an unsigned error magnitude. Check n: it counts matched predictions.",
    },
    schedule: {
      title: "Scheduled basal rate",
      meaning:
        "Each step keeps the scheduled rate until the next entry. This is a schedule, not a delivery record.",
      check:
        "Read the time and U/h together; compare delivery records separately when checking what actually happened.",
    },
    scatter: {
      title: "Paired readings",
      meaning:
        "This chart plots device B values horizontally against device A values vertically, with each point representing one paired reading.",
      check:
        "Remember that the diagonal line indicates equal values, but this comparison does not establish which device is correct.",
    },
    sleep: {
      title: "Recorded sleep stages",
      meaning:
        "This chart stacks recorded sleep-stage minutes for each calendar day, showing gaps for days without a recorded night.",
      check:
        "Note that sleep stages originate from the device source and this graph does not diagnose sleep quality.",
    },
  };
}
