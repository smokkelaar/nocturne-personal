import { coachCopy, type CoachCopyKey } from "$lib/coach-marks/copy.svelte";
import type { HelpSection } from "./documentation-types";

const loopAnalysisPages = [
  "/reports/loop-analysis",
  "/reports/loop-analysis/daily-profile",
  "/reports/loop-analysis/meals-and-events",
  "/reports/loop-analysis/prediction-accuracy",
  "/reports/loop-analysis/loop-health",
  "/reports/loop-analysis/settings-evidence",
];

/**
 * The help articles that repeat each tutorial step. A tour shows once and can
 * be turned off, so its text stays readable in the help. Keyed by every step,
 * so a new step does not compile until it names its pages.
 */
const tutorialPages: Record<CoachCopyKey, string[]> = {
  "quick-tour.current-bg": ["/"],
  "quick-tour.widgets": ["/"],
  "quick-tour.chart": ["/"],
  "feature-intro.calendar-views": ["/calendar"],
  "feature-intro.calendar-trackers": ["/calendar"],
  "feature-intro.meals-matching": ["/meals"],
  "feature-intro.appearance-widgets": ["/settings/appearance"],
  "loop-analysis-pages.switcher": loopAnalysisPages,
  "loop-analysis-daily-profile.totals": [
    "/reports/loop-analysis/daily-profile",
  ],
  "loop-analysis-daily-profile.glucose": [
    "/reports/loop-analysis/daily-profile",
  ],
  "loop-analysis-daily-profile.correction": [
    "/reports/loop-analysis/daily-profile",
  ],
  "loop-analysis-daily-profile.days": ["/reports/loop-analysis/daily-profile"],
  "loop-analysis-meals-and-events.builder": [
    "/reports/loop-analysis/meals-and-events",
  ],
  "loop-analysis-meals-and-events.curves": [
    "/reports/loop-analysis/meals-and-events",
  ],
  "loop-analysis-meals-and-events.metrics": [
    "/reports/loop-analysis/meals-and-events",
  ],
  "loop-analysis-meals-and-events.events": [
    "/reports/loop-analysis/meals-and-events",
  ],
  "loop-analysis-prediction-accuracy.horizons": [
    "/reports/loop-analysis/prediction-accuracy",
  ],
  "loop-analysis-prediction-accuracy.hours": [
    "/reports/loop-analysis/prediction-accuracy",
  ],
  "loop-analysis-prediction-accuracy.contexts": [
    "/reports/loop-analysis/prediction-accuracy",
  ],
  "loop-analysis-loop-health.tiles": ["/reports/loop-analysis/loop-health"],
  "loop-analysis-loop-health.hours": ["/reports/loop-analysis/loop-health"],
  "loop-analysis-loop-health.gaps": ["/reports/loop-analysis/loop-health"],
  "loop-analysis-settings-evidence.observations": [
    "/reports/loop-analysis/settings-evidence",
  ],
  "loop-analysis-settings-evidence.chart": [
    "/reports/loop-analysis/settings-evidence",
  ],
  "loop-analysis-settings-evidence.blocks": [
    "/reports/loop-analysis/settings-evidence",
  ],
  "tracker-intro.pill": ["/", "/settings/trackers"],
  "tracker-intro.complete": ["/", "/settings/trackers"],
  "tracker-intro.settings": ["/settings/trackers"],
  "tracker-intro.rail": ["/settings/appearance"],
};

/** The tutorial steps for each help article, in the tour's own words. */
export function tutorialSections(): Record<string, HelpSection[]> {
  const pages: Record<string, string[]> = tutorialPages;
  const sections: Record<string, HelpSection[]> = {};
  for (const [key, { title, description }] of Object.entries(coachCopy()))
    for (const href of pages[key] ?? [])
      (sections[href] ??= []).push({
        id: `tutorial-${key}`,
        title,
        text: description,
      });
  return sections;
}

/** Every help article that repeats a tutorial step. */
export const tutorialHrefs = (): string[] =>
  Object.values(tutorialPages)
    .flat()
    .filter((href, index, all) => all.indexOf(href) === index);
