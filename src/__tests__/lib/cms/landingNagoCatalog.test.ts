import { describe, expect, it } from "vitest";
import {
  NAGO_EDITABLE_COPY_KEYS,
  NAGO_LANDING_COPY_KEYS_BY_SECTION,
} from "@/lib/cms/landingNagoCatalog";
import { getLandingDefaultCopy } from "@/lib/cms/applyLandingContentOverrides";
import { LANDING_SECTION_SLUGS } from "@/types/theming";
import dictEs from "@/dictionaries/es.json";
import dictEn from "@/dictionaries/en.json";
import dictPt from "@/dictionaries/pt.json";
import type { Dictionary } from "@/types/i18n";

describe("NAGO_LANDING_COPY_KEYS_BY_SECTION", () => {
  it("has a non-empty entry for every canonical section slug", () => {
    for (const slug of LANDING_SECTION_SLUGS) {
      expect(NAGO_LANDING_COPY_KEYS_BY_SECTION[slug].length).toBeGreaterThan(0);
    }
  });

  it("contains no duplicates", () => {
    expect(new Set(NAGO_EDITABLE_COPY_KEYS).size).toBe(NAGO_EDITABLE_COPY_KEYS.length);
  });
});

describe("nago copy defaults", () => {
  const dicts: ReadonlyArray<readonly [string, Dictionary]> = [
    ["es", dictEs as Dictionary],
    ["en", dictEn as Dictionary],
    ["pt", dictPt as Dictionary],
  ];

  for (const [locale, dict] of dicts) {
    it(`resolves every editable key in the ${locale} dictionary`, () => {
      const missing = NAGO_EDITABLE_COPY_KEYS.filter(
        (key) => getLandingDefaultCopy(dict, key).length === 0,
      );
      expect(missing).toEqual([]);
    });
  }
});
