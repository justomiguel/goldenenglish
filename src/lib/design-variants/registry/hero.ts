import { heroPropsSchema } from "@/variants/hero/heroProps";
import type { SectionVariant } from "@/lib/design-variants/sectionVariant";

const shared = {
  slot: "hero" as const,
  major: 1,
  patch: 0,
  propsSchema: heroPropsSchema,
  editorFields: [],
  consumesTokens: ["color.background", "color.foreground", "color.muted.foreground"] as const,
  interactive: false,
};

export const HERO_VARIANTS: readonly SectionVariant<unknown>[] = [
  { ...shared, id: "hero.bleed", web: () => import("@/variants/hero/bleed/v1/Web") },
  { ...shared, id: "hero.split", web: () => import("@/variants/hero/split/v1/Web") },
  { ...shared, id: "hero.masthead", web: () => import("@/variants/hero/masthead/v1/Web") },
  { ...shared, id: "hero.stage", web: () => import("@/variants/hero/stage/v1/Web") },
  { ...shared, id: "hero.title", web: () => import("@/variants/hero/title/v1/Web") },
];
