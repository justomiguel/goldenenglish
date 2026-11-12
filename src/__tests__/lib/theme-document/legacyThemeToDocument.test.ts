import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import { parseDesignTokens } from "@/lib/design-tokens/parseDesignTokens";
import { genericKindToSections } from "@/lib/design-variants/genericKindToSections";
import { resolveSkin } from "@/lib/landing/skin/resolveSkin";
import { skinDefaults } from "@/lib/landing/skin/skinDefaults";
import type { SkinContentV1 } from "@/lib/landing/skin/skinModel";
import { legacyThemeToDocument } from "@/lib/theme-document/legacyThemeToDocument";
import { GENERIC_INSTITUTE_KINDS } from "@/lib/theme/genericInstituteTemplates";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import type { Dictionary } from "@/types/i18n";

const dict = es as Dictionary;
const stored: SkinContentV1 = {
  v: 1,
  sections: { inicio: { fields: { title: { es: "Club Norte" } } } },
};

describe("legacyThemeToDocument", () => {
  it("maps each generic kind to the registry sections and the resolved skin", () => {
    for (const kind of GENERIC_INSTITUTE_KINDS) {
      const properties = { "color.primary": "#103A5C" };
      const doc = legacyThemeToDocument(
        { properties, skin_content: stored, template_kind: kind },
        { dict, locale: "es" },
      );
      const skin = resolveSkin({ defaults: skinDefaults(dict, kind), stored, locale: "es" });
      expect(doc.sections.map((section) => `${section.variantId}@${section.major}`)).toEqual(
        genericKindToSections(kind).map((section) => `${section.variantId}@${section.major}`),
      );
      expect(doc.sections[0]?.props).toMatchObject({ title: skin.inicio.title });
      expect(doc.tokens).toEqual(parseDesignTokens({ ...SYSTEM_PROPERTIES_DEFAULTS, ...properties }));
      expect(doc.fontIds).toEqual(doc.tokens.font);
      expect(doc.editableBy).toEqual({});
    }
  });

  it("uses one owned page section for a bespoke kind", () => {
    const doc = legacyThemeToDocument({
      properties: {},
      skin_content: null,
      template_kind: "liora",
    });
    expect(doc.sections).toEqual([
      { id: "page", variantId: "page.bespoke-liora", major: 1, props: {} },
    ]);
    expect(doc.pages).toEqual({});
    expect(doc.editableBy).toEqual({});
  });
});
