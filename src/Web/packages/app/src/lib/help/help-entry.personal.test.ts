import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The help exists only in Personal. Upstream's versions of these files have no help, so a merge
// that resolves them to upstream's side drops the way in without failing any upstream test
// (4512ff8f7 did, see #88). This file has no upstream counterpart, so a merge keeps it.
const source = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("help entry points survive an upstream merge", () => {
  it("renders the help book in the desktop sidebar header", () => {
    const sidebar = source("lib/components/layout/AppSidebar.svelte");
    expect(sidebar).toContain(
      'import HelpIcon from "$lib/components/help/HelpIcon.svelte"'
    );
    expect(sidebar).toMatch(
      /<Sidebar\.Header[\s\S]*?<HelpIcon \/>[\s\S]*?<\/Sidebar\.Header>/
    );
  });

  it("gives the help the app navigation for its article list and search", () => {
    const sidebar = source("lib/components/layout/AppSidebar.svelte");
    expect(sidebar).toMatch(/help\.navigation = navigation/);
  });

  it("renders the help book in the mobile header", () => {
    const header = source("lib/components/layout/MobileHeader.svelte");
    expect(header).toContain(
      'import HelpIcon from "$lib/components/help/HelpIcon.svelte"'
    );
    expect(header).toContain("<HelpIcon />");
  });

  it("creates the help context and its views in the authenticated layout", () => {
    const layout = source("routes/(authenticated)/+layout.svelte");
    expect(layout).toContain("createHelpContext()");
    expect(layout).toContain("<HelpBar />");
    expect(layout).toContain("<HelpPageView>");
  });
});
