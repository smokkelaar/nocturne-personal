import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import supportedLocales from "../../../../../supportedLocales.json" with { type: "json" };

const localesDir = new URL("../../../../../locales/", import.meta.url);

function pluralFormsHeader(locale: string): { nplurals: number; rule: (n: number) => number } {
  const po = readFileSync(new URL(`${locale}.po`, localesDir), "utf8");
  const header = /"Plural-Forms: nplurals=(\d+); plural=(.+?);\\n"/.exec(po);
  if (!header) throw new Error(`${locale}.po has no Plural-Forms header`);
  // The header is the C expression gettext defines, which is also valid JavaScript.
  const rule = new Function("n", `return Number(${header[2]});`) as (n: number) => number;
  return { nplurals: Number(header[1]), rule };
}

/**
 * Whole numbers up to this bound reach every integer plural category of the supported locales;
 * the CLDR "many" of Spanish, French and Italian starts at a million and is out of reach of a
 * count of records.
 */
const COUNTS = Array.from({ length: 1000 }, (_, n) => n);

describe("Plural-Forms headers", () => {
  it.each(supportedLocales)("%s groups whole numbers the way CLDR does", (locale) => {
    const { nplurals, rule } = pluralFormsHeader(locale);
    const cldr = new Intl.PluralRules(locale);

    const formOf = new Map<string, number>();
    for (const n of COUNTS) {
      const form = rule(n);
      expect(form, `${locale}: form of ${n}`).toBeGreaterThanOrEqual(0);
      expect(form, `${locale}: form of ${n}`).toBeLessThan(nplurals);

      const category = cldr.select(n);
      const seen = formOf.get(category);
      if (seen === undefined) formOf.set(category, form);
      else expect(form, `${locale}: ${n} is "${category}"`).toBe(seen);
    }

    expect(new Set(formOf.values()).size, `${locale}: forms in use`).toBe(formOf.size);
    expect(nplurals, `${locale}: nplurals`).toBe(formOf.size);
  });
});
