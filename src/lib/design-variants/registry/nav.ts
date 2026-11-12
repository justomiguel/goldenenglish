import { z } from "zod";
import type { SectionVariant } from "@/lib/design-variants/sectionVariant";

const navPropsSchema = z.object({
  kind: z.string(),
  siteName: z.string(),
  logoAlt: z.string(),
  cta: z.string(),
  items: z.array(z.object({ id: z.string(), label: z.string() })),
});

export const NAV_VARIANTS: readonly SectionVariant<unknown>[] = [
  {
    id: "nav.generic",
    slot: "nav",
    major: 1,
    patch: 0,
    propsSchema: navPropsSchema,
    editorFields: [],
    consumesTokens: ["color.foreground", "color.background"],
    interactive: true,
    web: () => import("@/variants/nav/generic/v1/Web"),
    pwa: () => import("@/variants/nav/generic/v1/Pwa"),
  },
];
