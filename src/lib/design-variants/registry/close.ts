import { z } from "zod";
import type { SectionVariant } from "@/lib/design-variants/sectionVariant";

const closePropsSchema = z
  .object({
    copy: z.object({ laterTitle: z.string(), laterBody: z.string(), cta: z.string() }).passthrough(),
    locale: z.string(),
  })
  .passthrough();

const shared = {
  slot: "close" as const,
  major: 1,
  patch: 0,
  propsSchema: closePropsSchema,
  editorFields: [],
  consumesTokens: ["color.background", "color.foreground", "color.primary", "color.primary.foreground"] as const,
  interactive: false,
};

export const CLOSE_VARIANTS: readonly SectionVariant<unknown>[] = [
  { ...shared, id: "close.paper", web: () => import("@/variants/close/paper/v1/Web") },
  { ...shared, id: "close.quiet", web: () => import("@/variants/close/quiet/v1/Web") },
  { ...shared, id: "close.narrow", web: () => import("@/variants/close/narrow/v1/Web") },
  { ...shared, id: "close.stage", web: () => import("@/variants/close/stage/v1/Web") },
  { ...shared, id: "close.under", web: () => import("@/variants/close/under/v1/Web") },
];
