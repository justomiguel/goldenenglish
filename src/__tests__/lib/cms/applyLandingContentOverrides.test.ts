import { describe, expect, it } from "vitest";
import enDict from "@/dictionaries/en.json";
import esDict from "@/dictionaries/es.json";
import {
  applyLandingContentOverrides,
  getLandingDefaultCopy,
} from "@/lib/cms/applyLandingContentOverrides";
import type { Dictionary } from "@/types/i18n";
import type { SiteThemeContent } from "@/types/theming";

const en: Dictionary = enDict as Dictionary;
const es: Dictionary = esDict as Dictionary;

describe("getLandingDefaultCopy", () => {
  it("returns scalar values from the landing dictionary", () => {
    expect(getLandingDefaultCopy(en, "story.title")).toBe("Our story");
    expect(getLandingDefaultCopy(es, "story.title")).toBe("Nuestra historia");
    expect(getLandingDefaultCopy(en, "modalities.presencial.b2")).toContain(
      "Printed",
    );
  });

  it("returns '' for non-string paths", () => {
    expect(getLandingDefaultCopy(en, "collage.alts")).toBe("");
    expect(getLandingDefaultCopy(en, "modalities")).toBe("");
    expect(getLandingDefaultCopy(en, "does.not.exist")).toBe("");
  });
});

describe("applyLandingContentOverrides", () => {
  it("returns the same dict when no content present", () => {
    expect(applyLandingContentOverrides(en, null, "en")).toBe(en);
    expect(applyLandingContentOverrides(en, {}, "en")).toBe(en);
  });

  it("ignores unsupported locales", () => {
    const content: SiteThemeContent = {
      historia: { "story.title": { es: "Historia X", en: "Story X" } },
    };
    expect(applyLandingContentOverrides(en, content, "fr")).toBe(en);
  });

  it("only honors keys in the closed catalog", () => {
    const content: SiteThemeContent = {
      historia: {
        "story.title": { en: "Brand-new story" },
        "story.unknown": { en: "Should be ignored" },
      },
      modalidades: {
        "modalities.notInCatalog": { en: "ignored" },
      },
    };
    const result = applyLandingContentOverrides(en, content, "en");
    expect(result).not.toBe(en);
    expect(result.landing.story.title).toBe("Brand-new story");
    expect((result.landing.story as Record<string, unknown>).unknown).toBeUndefined();
    expect(
      (result.landing.modalities as Record<string, unknown>).notInCatalog,
    ).toBeUndefined();
    expect(en.landing.story.title).toBe("Our story");
  });

  it("only applies overrides for the requested locale", () => {
    const content: SiteThemeContent = {
      historia: {
        "story.title": { es: "Solo ES", en: "Only EN" },
        "story.body1": { es: "Cuerpo ES" },
      },
    };
    const enResult = applyLandingContentOverrides(en, content, "en");
    expect(enResult.landing.story.title).toBe("Only EN");
    expect(enResult.landing.story.body1).toBe(en.landing.story.body1);

    const esResult = applyLandingContentOverrides(es, content, "es");
    expect(esResult.landing.story.title).toBe("Solo ES");
    expect(esResult.landing.story.body1).toBe("Cuerpo ES");
  });

  it("falls back to the default when override is empty/whitespace", () => {
    const content: SiteThemeContent = {
      historia: {
        "story.title": { en: "   " },
        "story.body1": { en: "" },
      },
    };
    const result = applyLandingContentOverrides(en, content, "en");
    expect(result).toBe(en);
  });

  it("supports nested paths like modalities.presencial.b2", () => {
    const content: SiteThemeContent = {
      modalidades: {
        "modalities.presencial.b2": { en: "Brand-new bullet" },
      },
    };
    const result = applyLandingContentOverrides(en, content, "en");
    expect(result.landing.modalities.presencial.b2).toBe("Brand-new bullet");
    expect(result.landing.modalities.presencial.b1).toBe(
      en.landing.modalities.presencial.b1,
    );
  });
});
