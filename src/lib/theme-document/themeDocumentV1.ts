import { z } from "zod";
import {
  COLOR_TOKEN_KEYS,
  HEADING_WEIGHTS,
  INSTALL_STATUS_BARS,
  MOTION_LEVELS,
  SPACE_DENSITIES,
  TYPE_SCALES,
  type DesignTokensV1,
} from "@/lib/design-tokens/designTokensV1";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";

export const THEME_PAGE_IDS = ["home", "register", "contact", "blog", "privacy", "answers", "events", "findClass"] as const;

export type ThemePageId = (typeof THEME_PAGE_IDS)[number];

export interface ThemeDocumentV1 {
  contractVersion: 1;
  tokens: DesignTokensV1;
  fontIds: { heading: string; body: string };
  sections: readonly ThemeSection[];
  pages: Partial<Record<ThemePageId, { sections: readonly ThemeSection[] }>>;
  editableBy: Record<string, "staff" | "admin">;
}

const colorShape = Object.fromEntries(COLOR_TOKEN_KEYS.map((key) => [key, z.string()])) as Record<
  (typeof COLOR_TOKEN_KEYS)[number],
  z.ZodString
>;

const tokensSchema = z.object({
  version: z.literal(1),
  color: z.object(colorShape),
  font: z.object({ heading: z.string().min(1), body: z.string().min(1) }),
  type: z.object({ scale: z.enum(TYPE_SCALES), headingWeight: z.union(HEADING_WEIGHTS.map((weight) => z.literal(weight))) }),
  radius: z.object({ control: z.string(), card: z.string() }),
  space: z.object({ density: z.enum(SPACE_DENSITIES) }),
  shadow: z.object({ soft: z.string(), card: z.string() }),
  motion: z.object({ level: z.enum(MOTION_LEVELS) }),
  install: z
    .object({
      theme: z.string(),
      background: z.string(),
      statusBar: z.enum(INSTALL_STATUS_BARS),
    })
    .optional(),
});

const sectionSchema = z.object({
  id: z.string().min(1),
  variantId: z.string().min(1),
  major: z.number().int(),
  props: z.unknown(),
});

function uniqueSectionIds(sections: { id: string }[], ctx: z.RefinementCtx, path: (string | number)[]): void {
  const seen = new Set<string>();
  for (const section of sections) {
    if (seen.has(section.id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "duplicate_section_id", path });
      return;
    }
    seen.add(section.id);
  }
}

const pageSchema = z.object({ sections: z.array(sectionSchema) }).superRefine((page, ctx) => {
  uniqueSectionIds(page.sections, ctx, ["sections"]);
});

const pageShape = Object.fromEntries(THEME_PAGE_IDS.map((id) => [id, pageSchema.optional()])) as Record<
  ThemePageId,
  z.ZodOptional<typeof pageSchema>
>;

export const themeDocumentV1Schema: z.ZodType<ThemeDocumentV1> = z
  .object({
    contractVersion: z.literal(1),
    tokens: tokensSchema,
    fontIds: z.object({ heading: z.string().min(1), body: z.string().min(1) }),
    sections: z.array(sectionSchema),
    pages: z.object(pageShape).strict(),
    editableBy: z.record(z.string(), z.enum(["staff", "admin"])),
  })
  .superRefine((doc, ctx) => {
    uniqueSectionIds(doc.sections, ctx, ["sections"]);
  });
