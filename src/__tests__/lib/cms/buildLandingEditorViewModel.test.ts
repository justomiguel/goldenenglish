import { describe, expect, it } from "vitest";
import enDict from "@/dictionaries/en.json";
import esDict from "@/dictionaries/es.json";
import {
  buildLandingEditorOverview,
  buildLandingSectionEditorViewModel,
} from "@/lib/cms/buildLandingEditorViewModel";
import type { Dictionary } from "@/types/i18n";
import type {
  SiteThemeContent,
  SiteThemeMediaRow,
} from "@/types/theming";

const defaults = {
  en: enDict as Dictionary,
  es: esDict as Dictionary,
};

const sampleMedia: SiteThemeMediaRow[] = [
  {
    id: "m1",
    themeId: "t1",
    section: "inicio",
    position: 1,
    storagePath: "t1/inicio/1.png",
    altEs: null,
    altEn: null,
  },
];

const sampleContent: SiteThemeContent = {
  inicio: {
    "hero.kicker": { es: "Hola", en: "Hello" },
    "hero.ctaRegister": { es: "" },
  },
};

describe("buildLandingSectionEditorViewModel", () => {
  it("populates copy fields with defaults and override values", () => {
    const view = buildLandingSectionEditorViewModel("inicio", {
      defaults,
      content: sampleContent,
      media: sampleMedia,
      blocks: [],
    });
    const kicker = view.copy.find((f) => f.key === "hero.kicker")!;
    expect(kicker.defaults.es).toBe(defaults.es.landing.hero.kicker);
    expect(kicker.defaults.en).toBe(defaults.en.landing.hero.kicker);
    expect(kicker.overrides.es).toBe("Hola");
    expect(kicker.overrides.en).toBe("Hello");
  });

  it("treats empty overrides as not present", () => {
    const view = buildLandingSectionEditorViewModel("inicio", {
      defaults,
      content: sampleContent,
      media: [],
      blocks: [],
    });
    const cta = view.copy.find((f) => f.key === "hero.ctaRegister")!;
    expect(cta.overrides.es).toBeNull();
    expect(cta.overrides.en).toBeNull();
  });

  it("emits one media slot per declared position", () => {
    const view = buildLandingSectionEditorViewModel("inicio", {
      defaults,
      content: null,
      media: sampleMedia,
      blocks: [],
    });
    expect(view.media).toHaveLength(3);
    expect(view.media[0]?.current?.id).toBe("m1");
    expect(view.media[1]?.current).toBeNull();
  });

  it("returns empty media for sections without slots", () => {
    const view = buildLandingSectionEditorViewModel("certificaciones", {
      defaults,
      content: null,
      media: [],
      blocks: [],
    });
    expect(view.media).toEqual([]);
  });

  it("returns blocks ordered by position for the requested section only", () => {
    const view = buildLandingSectionEditorViewModel("modalidades", {
      defaults,
      content: null,
      media: [],
      blocks: [
        { id: "a", section: "inicio", kind: "card", position: 0, copy: { es: { title: "x" }, en: {} } },
        { id: "b", section: "modalidades", kind: "card", position: 1, copy: { es: { title: "second" }, en: {} } },
        { id: "c", section: "modalidades", kind: "card", position: 0, copy: { es: { title: "first" }, en: {} } },
      ],
    });
    expect(view.blocks.map((b) => b.id)).toEqual(["c", "b"]);
  });
});

describe("buildLandingEditorOverview", () => {
  it("counts overrides per section", () => {
    const overview = buildLandingEditorOverview({
      defaults,
      content: sampleContent,
      media: sampleMedia,
      blocks: [
        { id: "a", section: "modalidades", kind: "card", position: 0, copy: { es: { title: "x" }, en: {} } },
      ],
    });
    const inicio = overview.find((s) => s.section === "inicio")!;
    expect(inicio.copyOverridesCount).toBe(1);
    expect(inicio.mediaOverridesCount).toBe(1);
    expect(inicio.copyFieldsTotal).toBeGreaterThan(0);
    expect(inicio.mediaSlotsTotal).toBe(3);
    expect(inicio.blocksCount).toBe(0);
    const modal = overview.find((s) => s.section === "modalidades")!;
    expect(modal.blocksCount).toBe(1);
  });
});
