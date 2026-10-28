import { describe, expect, it } from "vitest";
import { coachCopy } from "$lib/coach-marks/copy.svelte";
import { articles } from "./documentation.svelte";
import { tutorialHrefs } from "./tutorials.svelte";

describe("tutorials in the help", () => {
  it("names only pages that have a help article", () => {
    const hrefs = new Set(articles().map((article) => article.href));
    expect(tutorialHrefs().filter((href) => !hrefs.has(href))).toEqual([]);
  });

  it("repeats every tutorial step in the help, in the tour's words", () => {
    const sections = articles().flatMap((article) => article.sections);
    for (const [key, step] of Object.entries(coachCopy())) {
      const section = sections.find((s) => s.id === `tutorial-${key}`);
      expect(section, key).toMatchObject({
        title: step.title,
        text: step.description,
      });
    }
  });

  it("explains the tracker pill on the dashboard and the tracker settings", () => {
    for (const href of ["/", "/settings/trackers"])
      expect(
        articles()
          .find((article) => article.href === href)!
          .sections.map((s) => s.id)
      ).toContain("tutorial-tracker-intro.pill");
  });
});
