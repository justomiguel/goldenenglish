import { z } from "zod";
import type { SectionVariant } from "@/lib/design-variants/sectionVariant";

const footerPropsSchema = z.object({
  siteName: z.string(),
});

export const FOOTER_VARIANTS: readonly SectionVariant<unknown>[] = [
  {
    id: "footer.generic",
    slot: "footer",
    major: 1,
    patch: 0,
    propsSchema: footerPropsSchema,
    editorFields: [],
    consumesTokens: ["color.foreground", "color.muted.foreground", "color.border"],
    interactive: false,
    web: () => import("@/variants/footer/generic/v1/Web"),
  },
];
