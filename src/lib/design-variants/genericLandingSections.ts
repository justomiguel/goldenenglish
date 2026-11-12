import {
  GENERIC_LANDING_SECTIONS,
  genericLandingComposition,
  type GenericLandingSection,
} from "@/lib/landing/genericLandingComposition";
import type { GenericLandingCopy } from "@/lib/landing/genericLandingCopy";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import { genericSectionStockPath, type GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";

export interface GenericLandingSectionInput {
  kind: GenericInstituteKind;
  copy: GenericLandingCopy;
  locale: string;
  heroSrc?: string;
  sectionSrc?: Partial<Record<GenericLandingSection, string>>;
  sectionLabels?: Partial<Record<GenericLandingSection, string>>;
  hiddenSections?: ReadonlySet<string>;
  contact?: unknown;
  contactLabels?: unknown;
}

export function genericLandingSections(input: GenericLandingSectionInput): ThemeSection[] {
  const composition = genericLandingComposition(input.kind);
  const items = GENERIC_LANDING_SECTIONS.filter((section) => !input.hiddenSections?.has(section)).map((section) => ({
    id: section,
    label: input.sectionLabels?.[section] ?? section,
    sentence: input.copy.sections[section],
    src: input.sectionSrc?.[section] ?? genericSectionStockPath(input.kind, section),
  }));
  return [
    {
      id: "hero",
      variantId: `hero.${composition.hero}`,
      major: 1,
      props: {
        scene: input.copy.scene,
        title: input.copy.title,
        body: input.copy.body,
        imageAlt: input.copy.imageAlt,
        name: input.copy.name,
        heroSrc: input.heroSrc ?? genericSectionStockPath(input.kind, "inicio"),
      },
    },
    {
      id: "schedule",
      variantId: `schedule.${composition.day}`,
      major: 1,
      props: { lines: [input.copy.rhythmA, input.copy.rhythmB, input.copy.rhythmC] },
    },
    { id: "band", variantId: `band.${composition.bands}`, major: 1, props: { items } },
    {
      id: "close",
      variantId: `close.${composition.close}`,
      major: 1,
      props: {
        copy: input.copy,
        locale: input.locale,
        contact: input.contact,
        contactLabels: input.contactLabels,
      },
    },
  ];
}
