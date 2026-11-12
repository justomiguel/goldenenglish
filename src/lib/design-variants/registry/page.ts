import { z } from "zod";
import { EXCLUSIVE_THEME_OWNERS } from "@/lib/theme/exclusiveThemeKinds";
import type { SectionVariant } from "@/lib/design-variants/sectionVariant";

const pagePropsSchema = z.object({}).passthrough();

const bridge = {
  slot: "page" as const,
  major: 1,
  patch: 0,
  propsSchema: pagePropsSchema,
  editorFields: [],
  consumesTokens: ["color.background", "color.foreground"] as const,
  interactive: false,
  web: () => import("@/variants/page/bridge/v1/Web"),
};

export const PAGE_VARIANTS: readonly SectionVariant<unknown>[] = Object.entries(EXCLUSIVE_THEME_OWNERS).flatMap(
  ([kind, owners]) => {
    const owner = owners?.[0];
    if (!owner) return [];
    return [{ ...bridge, id: `page.bespoke-${kind}`, owner }];
  },
);
