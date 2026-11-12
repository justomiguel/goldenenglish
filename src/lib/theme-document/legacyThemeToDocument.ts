import { parseDesignTokens } from "@/lib/design-tokens/parseDesignTokens";
import { genericKindToSections } from "@/lib/design-variants/genericKindToSections";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import { resolveSkin } from "@/lib/landing/skin/resolveSkin";
import { skinDefaults } from "@/lib/landing/skin/skinDefaults";
import type { ResolvedSkin, SkinContentV1, SkinLocale } from "@/lib/landing/skin/skinModel";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { genericSectionStockPath, isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import type { ThemeProperties } from "@/lib/theme/themeParser";
import type { SiteThemeKind } from "@/types/theming";
import type { Dictionary } from "@/types/i18n";

export interface LegacyThemeRow {
  properties: ThemeProperties;
  skin_content: unknown;
  template_kind: SiteThemeKind;
}

export interface LegacyThemeOptions {
  dict?: Dictionary;
  locale?: SkinLocale;
}

function readSkin(value: unknown): SkinContentV1 {
  if (!value || typeof value !== "object") return { v: 1, sections: {} };
  const record = value as { v?: unknown; sections?: unknown };
  if (record.v !== 1 || !record.sections || typeof record.sections !== "object") return { v: 1, sections: {} };
  return { v: 1, sections: record.sections as SkinContentV1["sections"] };
}

function propsFor(section: ThemeSection, skin: ResolvedSkin, kind: Parameters<typeof genericSectionStockPath>[0], locale: string): unknown {
  if (section.variantId.startsWith("hero.")) {
    return {
      scene: skin.inicio.scene,
      title: skin.inicio.title,
      body: skin.inicio.body,
      imageAlt: skin.inicio.imageAlt,
      name: skin.inicio.title,
      heroSrc: genericSectionStockPath(kind, "inicio"),
    };
  }
  if (section.variantId.startsWith("schedule.")) {
    return { lines: skin.ritmo.lines.map((line) => line.text) };
  }
  if (section.variantId.startsWith("band.")) {
    return {
      items: skin.oferta.items.map((item) => ({
        id: item.id,
        label: item.name,
        sentence: item.line,
        src: genericSectionStockPath(kind, "oferta"),
      })),
    };
  }
  return {
    copy: { laterTitle: skin.contacto.laterTitle, laterBody: skin.contacto.laterBody, cta: skin.inicio.cta },
    locale,
  };
}

export function legacyThemeToDocument(row: LegacyThemeRow, options: LegacyThemeOptions = {}): ThemeDocumentV1 {
  const locale = options.locale ?? "es";
  const merged = { ...SYSTEM_PROPERTIES_DEFAULTS, ...row.properties };
  const tokens = parseDesignTokens(merged);
  const kind = row.template_kind;
  const sections: ThemeSection[] = isGenericInstituteKind(kind)
    ? genericKindToSections(kind).map((section) => ({
        ...section,
        props: options.dict
          ? propsFor(
              section,
              resolveSkin({ defaults: skinDefaults(options.dict, kind), stored: readSkin(row.skin_content), locale }),
              kind,
              locale,
            )
          : section.props,
      }))
    : [{ id: "page", variantId: `page.bespoke-${kind}`, major: 1, props: {} }];
  return {
    contractVersion: 1,
    tokens,
    fontIds: { heading: tokens.font.heading, body: tokens.font.body },
    sections,
    pages: {},
    editableBy: {},
  };
}
