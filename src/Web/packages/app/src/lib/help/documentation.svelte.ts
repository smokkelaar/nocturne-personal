import type { NavItem, NavLink } from "$lib/navigation/app-navigation.svelte";
import type { HelpArticle } from "./documentation-types";
import { dashboardTopics, chartTopics } from "./dashboard-guide.svelte";
import { pageArticles } from "./pages.svelte";
import { reportArticles } from "./reports.svelte";
import { settingsArticles } from "./settings.svelte";
import { connectorArticles } from "./connectors.svelte";
import { readingGuides } from "./reading-guides.svelte";
import { pageMeanings } from "./meanings.svelte";
import { reportMeanings } from "./report-meanings.svelte";
import { workflowArticles } from "./workflows.svelte";
import { glucoseReferenceArticle } from "./glucose-reference.svelte";
import { GLUCOSE_REFERENCE_PATH } from "./reference-path";

// Per-call factories let translated titles follow the current locale.
export function articles(): HelpArticle[] {
  const readings = readingGuides();
  const meanings = { ...pageMeanings(), ...reportMeanings() };
  const entries = [
    ...pageArticles(),
    ...reportArticles(),
    ...settingsArticles(),
    ...connectorArticles(),
    ...workflowArticles(),
    glucoseReferenceArticle(),
  ];
  return entries.map((article) => {
    const reading = readings[article.href];
    const related = [...article.related];
    if (["/", "/settings/profile", "/alerts"].includes(article.href))
      related.push(GLUCOSE_REFERENCE_PATH);
    const sections =
      article.href === "/"
        ? [
            ...article.sections,
            ...[...dashboardTopics(), ...chartTopics()].map((topic) => ({
              title: topic.title,
              text: `${topic.meaning} ${topic.source} ${topic.availability} ${topic.check}`,
            })),
          ]
        : article.sections;
    const meaning = article.meaning ?? meanings[article.href];
    return { ...article, ...reading, meaning, related, sections };
  });
}

function parentFor(href: string): string | undefined {
  // The report overview is not permission to visit every report.
  if (href.startsWith("/reports/loop-analysis/"))
    return "/reports/loop-analysis";
  if (href.startsWith("/reports/"))
    return href.startsWith("/reports/data-quality/")
      ? "/reports/data-quality"
      : href;
  if (href === "/settings/weight" || href === "/settings/timezone")
    return "/settings/patient";
  if (
    href === "/settings/migration" ||
    href === "/settings/nightscout-transition"
  )
    return "/settings/connectors";
  if (href === "/settings/integrations/discord") return "/settings/account";
  if (href === "/tools") return "/tools/packing";
  if (href === "/notifications") return "/settings/trackers";
  if (
    href.startsWith("/settings/admin/") ||
    href === "/settings/access-requests" ||
    href === "/settings/audit"
  )
    return "/settings/admin/tenants";
  return undefined;
}

export function documentationLinks(navigation: NavItem[]): NavLink[] {
  const links = navigation.flatMap((item) =>
    item.children
      ? [...item.children]
      : item.href
        ? [{ ...item, href: item.href }]
        : []
  );
  const allowed = links.map((link) => link.href);
  const library = articles();
  for (const article of library) {
    if (article.helpOnly) {
      const parent = links.find((link) =>
        library
          .find((entry) => entry.href === link.href)
          ?.related.includes(article.href)
      );
      if (parent)
        links.push({
          ...parent,
          title: article.title,
          href: article.href,
          strict: true,
        });
      continue;
    }
    if (article.href.includes("[") || allowed.includes(article.href)) continue;
    const explicit = parentFor(article.href);
    const parent = explicit
      ? links.find((link) => link.href === explicit)
      : links.find(
          (link) =>
            allowed.includes(link.href) &&
            link.href !== "/" &&
            article.href.startsWith(`${link.href}/`)
        );
    if (parent)
      links.push({
        ...parent,
        strict: true,
        title: article.title,
        href: article.href,
      });
  }
  return links;
}

/**
 * Whether `path` fills the `[param]` segments of a detail route such as
 * `/alerts/[id]`.
 */
function matchesDetailRoute(route: string, path: string): boolean {
  if (!route.includes("[")) return false;
  const expected = route.split("/");
  const actual = path.split("/");
  return (
    expected.length === actual.length &&
    expected.every(
      (segment, i) =>
        (segment.startsWith("[") && actual[i] !== "") || segment === actual[i]
    )
  );
}

export function articleFor(path: string, links: NavLink[]): HelpArticle {
  const normalized = path.replace(/\/+$/, "") || "/";
  const all = articles();
  const exact = all.find((entry) => entry.href === normalized);
  if (exact) return exact;
  const detail = all.find((entry) =>
    matchesDetailRoute(entry.href, normalized)
  );
  if (detail) return detail;
  const parent = all
    .filter(
      (entry) => entry.href !== "/" && normalized.startsWith(`${entry.href}/`)
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (parent) return { ...parent, href: normalized };
  const title =
    links.find((link) => link.href === normalized)?.title ?? "Page guide";
  return {
    href: normalized,
    title,
    introduction:
      "Use this page's visible controls and field descriptions to inspect its information.",
    sections: [
      {
        title: "Settings and access",
        text: "Available actions depend on the selected tenant and your permissions. Check the related settings in the navigation menu. Close documentation with the book or Escape to return to your original page.",
      },
    ],
    related: [],
  };
}

export function searchDocumentation(query: string, links: NavLink[]) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return links
    .map((link) => articleFor(link.href, links))
    .filter((article) => {
      const text = [
        article.title,
        article.introduction,
        ...(article.reading ?? []).flatMap((step) => [step.title, step.text]),
        ...(article.meaning ?? []).flatMap((item) => [item.title, item.text]),

        ...article.sections.flatMap((section) => [section.title, section.text]),
        ...(article.steps ?? []).flatMap((step) => [step.title, step.text]),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return terms.every((term) => text.includes(term));
    });
}
