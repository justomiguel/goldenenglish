import { z } from "zod";
import { siteThemeIdSchema } from "@/lib/cms/siteThemeInputSchemas";
import {
  LANDING_BLOCK_KINDS,
  LANDING_SECTION_SLUGS,
  SITE_THEME_KINDS,
  type LandingBlockKind,
  type LandingSectionSlug,
  type SiteThemeKind,
} from "@/types/theming";

/**
 * Zod schemas for the dynamic blocks editor (PR 6) and for the template_kind
 * selector. Pure module so server actions and tests share the same
 * definitions, mirroring `siteThemeLandingInputSchemas.ts`.
 */

const landingSectionSchema: z.ZodType<LandingSectionSlug> = z.enum([
  ...LANDING_SECTION_SLUGS,
] as [LandingSectionSlug, ...LandingSectionSlug[]]);

const landingBlockKindSchema: z.ZodType<LandingBlockKind> = z.enum([
  ...LANDING_BLOCK_KINDS,
] as [LandingBlockKind, ...LandingBlockKind[]]);

const siteThemeKindSchema: z.ZodType<SiteThemeKind> = z.enum([
  ...SITE_THEME_KINDS,
] as [SiteThemeKind, ...SiteThemeKind[]]);

const localeCopyInputSchema = z
  .object({
    title: z.string().trim().max(120, "title_too_long").optional(),
    body: z.string().trim().max(600, "body_too_long").optional(),
  })
  .strict();

const blockCopyInputSchema = z
  .object({
    es: localeCopyInputSchema,
    en: localeCopyInputSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasAnyCopy =
      Boolean(value.es.title || value.es.body) ||
      Boolean(value.en.title || value.en.body);
    if (!hasAnyCopy) {
      ctx.addIssue({
        code: "custom",
        message: "block_empty",
        path: ["es"],
      });
    }
  });

export const addLandingBlockInputSchema = z.object({
  locale: z.string().min(2),
  id: siteThemeIdSchema,
  section: landingSectionSchema,
  kind: landingBlockKindSchema,
  copy: blockCopyInputSchema,
});

export type AddLandingBlockInput = z.infer<typeof addLandingBlockInputSchema>;

export const updateLandingBlockInputSchema = z.object({
  locale: z.string().min(2),
  id: siteThemeIdSchema,
  blockId: z.string().uuid("block_id_invalid"),
  copy: blockCopyInputSchema,
});

export type UpdateLandingBlockInput = z.infer<
  typeof updateLandingBlockInputSchema
>;

export const removeLandingBlockInputSchema = z.object({
  locale: z.string().min(2),
  id: siteThemeIdSchema,
  blockId: z.string().uuid("block_id_invalid"),
});

export type RemoveLandingBlockInput = z.infer<
  typeof removeLandingBlockInputSchema
>;

export const moveLandingBlockInputSchema = z.object({
  locale: z.string().min(2),
  id: siteThemeIdSchema,
  blockId: z.string().uuid("block_id_invalid"),
  direction: z.union([z.literal(-1), z.literal(1)]),
});

export type MoveLandingBlockInput = z.infer<typeof moveLandingBlockInputSchema>;

export const setSiteThemeKindInputSchema = z.object({
  locale: z.string().min(2),
  id: siteThemeIdSchema,
  kind: siteThemeKindSchema,
});

export type SetSiteThemeKindInput = z.infer<typeof setSiteThemeKindInputSchema>;
