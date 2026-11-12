import { genericLandingComposition } from "@/lib/landing/genericLandingComposition";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";

/** Section list for a generic landing. Props stay empty until the renderer maps skin content. */
export function genericKindToSections(kind: GenericInstituteKind): ThemeSection[] {
  const composition = genericLandingComposition(kind);
  return [
    { id: "hero", variantId: `hero.${composition.hero}`, major: 1, props: {} },
    { id: "schedule", variantId: `schedule.${composition.day}`, major: 1, props: {} },
    { id: "band", variantId: `band.${composition.bands}`, major: 1, props: {} },
    { id: "close", variantId: `close.${composition.close}`, major: 1, props: {} },
  ];
}
