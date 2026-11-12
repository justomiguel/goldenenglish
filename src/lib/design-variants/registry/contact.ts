import { z } from "zod";
import type { SectionVariant } from "@/lib/design-variants/sectionVariant";

const formSchema = z.object({
  locale: z.string(),
  submitLabel: z.string(),
  labels: z.object({ formName: z.string(), formEmail: z.string() }).passthrough(),
});

const mapSchema = z.object({
  address: z.string(),
  title: z.string(),
});

const tokens = ["color.foreground", "color.background", "color.border", "color.error"] as const;

export const CONTACT_VARIANTS: readonly SectionVariant<unknown>[] = [
  {
    id: "contact.form",
    slot: "contact",
    major: 1,
    patch: 0,
    propsSchema: formSchema,
    editorFields: [],
    consumesTokens: tokens,
    interactive: true,
    web: () => import("@/variants/contact/form/v1/Web"),
    pwa: () => import("@/variants/contact/form/v1/Pwa"),
  },
  {
    id: "contact.map",
    slot: "contact",
    major: 1,
    patch: 0,
    propsSchema: mapSchema,
    editorFields: [],
    consumesTokens: ["color.border"],
    interactive: false,
    web: () => import("@/variants/contact/map/v1/Web"),
  },
];
