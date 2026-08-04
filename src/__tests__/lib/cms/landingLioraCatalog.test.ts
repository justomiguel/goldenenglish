import { describe, expect, it } from "vitest";
import {
  LIORA_EDITABLE_COPY_KEYS,
  LIORA_LANDING_COPY_KEYS_BY_SECTION,
  LIORA_MEDIA_SLOTS_BY_SECTION,
} from "@/lib/cms/landingLioraCatalog";
import {
  landingCopyKeysForTheme,
  landingMediaSlotsForTheme,
} from "@/lib/cms/landingThemeEditorCatalog";
import { getLandingDefaultCopy } from "@/lib/cms/applyLandingContentOverrides";
import { LANDING_SECTION_SLUGS } from "@/types/theming";
import dictEs from "@/dictionaries/es.json";
import dictEn from "@/dictionaries/en.json";
import dictPt from "@/dictionaries/pt.json";
import type { Dictionary } from "@/types/i18n";

describe("LIORA_LANDING_COPY_KEYS_BY_SECTION", () => {
  it("has a non-empty entry for every canonical section slug", () => {
    for (const slug of LANDING_SECTION_SLUGS) {
      expect(LIORA_LANDING_COPY_KEYS_BY_SECTION).toHaveProperty(slug);
      expect(LIORA_LANDING_COPY_KEYS_BY_SECTION[slug].length).toBeGreaterThan(0);
    }
  });

  it("namespaces every key under liora.", () => {
    for (const key of LIORA_EDITABLE_COPY_KEYS) {
      expect(key).toMatch(/^liora\./);
    }
  });

  it("lists the four ballet levels in the clases section", () => {
    const oferta = LIORA_LANDING_COPY_KEYS_BY_SECTION.oferta;
    for (const level of ["preBallet", "infantil", "juvenil", "adulto"]) {
      expect(oferta).toContain(`liora.clases.${level}.title`);
      expect(oferta).toContain(`liora.clases.${level}.ages`);
      expect(oferta).toContain(`liora.clases.${level}.body`);
    }
  });

  it("lists the three sedes in the modalidades section", () => {
    const sedes = LIORA_LANDING_COPY_KEYS_BY_SECTION.modalidades;
    for (const sede of ["providencia", "maipu", "sanMiguel"]) {
      expect(sedes).toContain(`liora.sedes.${sede}.name`);
      expect(sedes).toContain(`liora.sedes.${sede}.metro`);
    }
  });
});

describe("LIORA_MEDIA_SLOTS_BY_SECTION", () => {
  it("has an entry for every canonical section slug", () => {
    for (const slug of LANDING_SECTION_SLUGS) {
      expect(LIORA_MEDIA_SLOTS_BY_SECTION).toHaveProperty(slug);
    }
  });

  it("reserves one slot per sede and one per ballet level", () => {
    expect(LIORA_MEDIA_SLOTS_BY_SECTION.modalidades).toBe(3);
    expect(LIORA_MEDIA_SLOTS_BY_SECTION.oferta).toBe(4);
  });

  it("exposes a single inicio slot (the hero background)", () => {
    expect(LIORA_MEDIA_SLOTS_BY_SECTION.inicio).toBe(1);
  });

  it("declares no image slots for the schedule and footer sections", () => {
    expect(LIORA_MEDIA_SLOTS_BY_SECTION.niveles).toBe(0);
    expect(LIORA_MEDIA_SLOTS_BY_SECTION.certificaciones).toBe(0);
  });
});

describe("LIORA_EDITABLE_COPY_KEYS", () => {
  it("is the flat union of all section keys", () => {
    const flat = Object.values(LIORA_LANDING_COPY_KEYS_BY_SECTION).flat();
    expect(LIORA_EDITABLE_COPY_KEYS).toEqual(flat);
  });

  it("contains no duplicates", () => {
    const unique = new Set(LIORA_EDITABLE_COPY_KEYS);
    expect(unique.size).toBe(LIORA_EDITABLE_COPY_KEYS.length);
  });
});

describe("liora copy defaults", () => {
  const dicts: ReadonlyArray<readonly [string, Dictionary]> = [
    ["es", dictEs as Dictionary],
    ["en", dictEn as Dictionary],
    ["pt", dictPt as Dictionary],
  ];

  for (const [locale, dict] of dicts) {
    it(`resolves every editable key in the ${locale} dictionary`, () => {
      const missing = LIORA_EDITABLE_COPY_KEYS.filter(
        (key) => getLandingDefaultCopy(dict, key).length === 0,
      );
      expect(missing).toEqual([]);
    });
  }
});

describe("landing theme editor catalog for liora", () => {
  it("routes copy keys to the liora catalog", () => {
    for (const slug of LANDING_SECTION_SLUGS) {
      expect(landingCopyKeysForTheme("liora", slug)).toEqual(
        LIORA_LANDING_COPY_KEYS_BY_SECTION[slug],
      );
    }
  });

  it("routes media slot counts to the liora catalog", () => {
    for (const slug of LANDING_SECTION_SLUGS) {
      expect(landingMediaSlotsForTheme("liora", slug)).toBe(
        LIORA_MEDIA_SLOTS_BY_SECTION[slug],
      );
    }
  });
});
