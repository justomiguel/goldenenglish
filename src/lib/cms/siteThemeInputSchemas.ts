import { z } from "zod";

/**
 * Zod schemas for site theme admin inputs. Pure module (no Supabase / fs) so
 * actions and tests can share the same source of truth for validation rules.
 *
 * `slug` accepts the same character set produced by `normalizeThemeSlug` —
 * the action layer normalizes user input before validating, so an unsanitized
 * payload (uppercase, accents, spaces) never reaches the database.
 */
export const siteThemeNameSchema = z
  .string()
  .trim()
  .min(2, "name_too_short")
  .max(80, "name_too_long");

export const siteThemeSlugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u, "slug_invalid")
  .min(2, "slug_too_short")
  .max(64, "slug_too_long");

export const siteThemeIdSchema = z.string().uuid("id_invalid");

export const createSiteThemeInputSchema = z.object({
  locale: z.string().min(2),
  name: siteThemeNameSchema,
  slug: siteThemeSlugSchema,
  /** When true, the new template is created and immediately activated. */
  activate: z.boolean().optional().default(false),
});

export type CreateSiteThemeInput = z.infer<typeof createSiteThemeInputSchema>;

export const renameSiteThemeInputSchema = z.object({
  locale: z.string().min(2),
  id: siteThemeIdSchema,
  name: siteThemeNameSchema,
});

export type RenameSiteThemeInput = z.infer<typeof renameSiteThemeInputSchema>;

export const activateSiteThemeInputSchema = z.object({
  locale: z.string().min(2),
  id: siteThemeIdSchema,
});

export const archiveSiteThemeInputSchema = z.object({
  locale: z.string().min(2),
  id: siteThemeIdSchema,
});

export const restoreSiteThemeInputSchema = z.object({
  locale: z.string().min(2),
  id: siteThemeIdSchema,
});

export const duplicateSiteThemeInputSchema = z.object({
  locale: z.string().min(2),
  sourceId: siteThemeIdSchema,
  name: siteThemeNameSchema,
  slug: siteThemeSlugSchema,
});

export type DuplicateSiteThemeInput = z.infer<typeof duplicateSiteThemeInputSchema>;

/**
 * Override map for the design system editor. Validation rules:
 * - Token keys mirror `system.properties` (dot-separated lowercase + digits).
 * - Empty string values mean "fall back to default" — the action will strip
 *   them so they never round-trip through the database.
 * - Hard cap on the number of overrides keeps payloads bounded; the editor
 *   tops out below this number for the foreseeable design surface.
 */
const tokenKeySchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9.]*[a-z0-9]$/u, "token_key_invalid")
  .max(80, "token_key_invalid");

const tokenValueSchema = z.string().max(200, "token_value_too_long");

export const themePropertyOverridesSchema = z
  .record(tokenKeySchema, tokenValueSchema)
  .refine((map) => Object.keys(map).length <= 256, {
    message: "too_many_overrides",
  });

export const updateSiteThemePropertiesInputSchema = z.object({
  locale: z.string().min(2),
  id: siteThemeIdSchema,
  overrides: themePropertyOverridesSchema,
});

export type UpdateSiteThemePropertiesInput = z.infer<
  typeof updateSiteThemePropertiesInputSchema
>;

export const resetSiteThemePropertiesInputSchema = z.object({
  locale: z.string().min(2),
  id: siteThemeIdSchema,
});
