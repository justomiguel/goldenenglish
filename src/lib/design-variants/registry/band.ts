import type { SectionVariant } from "@/lib/design-variants/sectionVariant";
import { bandPropsSchema } from "@/variants/band/bandProps";

const shared = {
  slot: "band" as const,
  major: 1,
  patch: 0,
  propsSchema: bandPropsSchema,
  editorFields: [],
  consumesTokens: ["color.foreground", "color.muted.foreground", "color.border"] as const,
  interactive: false,
};

export const BAND_VARIANTS: readonly SectionVariant<unknown>[] = [
  { ...shared, id: "band.alternate", web: () => import("@/variants/band/alternate/v1/Web") },
  { ...shared, id: "band.cluster", web: () => import("@/variants/band/cluster/v1/Web") },
  { ...shared, id: "band.ruled", web: () => import("@/variants/band/ruled/v1/Web") },
  { ...shared, id: "band.paper", web: () => import("@/variants/band/paper/v1/Web") },
  { ...shared, id: "band.breaks", web: () => import("@/variants/band/breaks/v1/Web") },
];
