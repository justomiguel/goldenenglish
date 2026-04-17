import { z } from "zod";
import { LANDING_MEDIA_SLOTS_BY_SECTION } from "@/lib/cms/landingContentCatalog";
import { LANDING_SECTION_SLUGS, type LandingSectionSlug } from "@/types/theming";
import { siteThemeIdSchema } from "@/lib/cms/siteThemeInputSchemas";

/**
 * Zod schemas for the landing CMS editor (copy + media). Pure module so
 * actions and tests share the same source of truth, mirroring the design
 * system editor schemas in `siteThemeInputSchemas.ts`.
 */

const landingSectionSchema: z.ZodType<LandingSectionSlug> = z.enum([
  ...LANDING_SECTION_SLUGS,
] as [LandingSectionSlug, ...LandingSectionSlug[]]);

/** Single localized copy bag — keys are validated runtime via the catalog so
 *  schemas stay agnostic of the (closed) editable paths. */
const localizedCopySchema = z
  .object({
    es: z.string().max(1500, "value_too_long").optional(),
    en: z.string().max(1500, "value_too_long").optional(),
  })
  .strict();

const sectionContentSchema = z.record(
  z.string().min(1).max(80),
  localizedCopySchema,
);

export const updateSiteThemeContentInputSchema = z.object({
  locale: z.string().min(2),
  id: siteThemeIdSchema,
  section: landingSectionSchema,
  /** Map of `<dotted dict path>` → `{ es?, en? }` for the section. The action
   *  layer runs `cleanLandingContentForPersistence` to drop unknown keys
   *  before persisting. */
  copy: sectionContentSchema,
});

export type UpdateSiteThemeContentInput = z.infer<
  typeof updateSiteThemeContentInputSchema
>;

export const resetSiteThemeContentInputSchema = z.object({
  locale: z.string().min(2),
  id: siteThemeIdSchema,
  /** When omitted, every section is wiped. */
  section: landingSectionSchema.optional(),
});

export type ResetSiteThemeContentInput = z.infer<
  typeof resetSiteThemeContentInputSchema
>;

const mediaPositionSchema = z
  .number()
  .int("position_invalid")
  .min(1, "position_invalid")
  .max(20, "position_invalid");

export const uploadSiteThemeMediaInputSchema = z
  .object({
    locale: z.string().min(2),
    id: siteThemeIdSchema,
    section: landingSectionSchema,
    position: mediaPositionSchema,
    contentType: z.string().min(3).max(80),
    fileName: z.string().min(1).max(120),
    /** Base64-encoded payload (the route layer handles `FormData` decoding). */
    fileBase64: z.string().min(1),
    altEs: z.string().trim().max(200).nullish(),
    altEn: z.string().trim().max(200).nullish(),
  })
  .superRefine((value, ctx) => {
    const max = LANDING_MEDIA_SLOTS_BY_SECTION[value.section];
    if (max <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "section_does_not_accept_media",
        path: ["section"],
      });
      return;
    }
    if (value.position > max) {
      ctx.addIssue({
        code: "custom",
        message: "position_out_of_range",
        path: ["position"],
      });
    }
  });

export type UploadSiteThemeMediaInput = z.infer<
  typeof uploadSiteThemeMediaInputSchema
>;

export const deleteSiteThemeMediaInputSchema = z.object({
  locale: z.string().min(2),
  id: siteThemeIdSchema,
  mediaId: z.string().uuid("media_id_invalid"),
});

export type DeleteSiteThemeMediaInput = z.infer<
  typeof deleteSiteThemeMediaInputSchema
>;

/** Closed list of MIME types accepted for landing media uploads. */
export const LANDING_MEDIA_ACCEPTED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type LandingMediaAcceptedMime =
  (typeof LANDING_MEDIA_ACCEPTED_MIME)[number];

export function isAcceptedLandingMediaMime(
  candidate: string,
): candidate is LandingMediaAcceptedMime {
  return (LANDING_MEDIA_ACCEPTED_MIME as ReadonlyArray<string>).includes(
    candidate,
  );
}

/** Maximum upload size in bytes (4 MB). The Storage layer also enforces
 *  caps but we reject early to give a clean error message. */
export const LANDING_MEDIA_MAX_BYTES = 4 * 1024 * 1024;

export function landingMediaExtensionForMime(
  mime: LandingMediaAcceptedMime,
): "png" | "jpg" | "webp" {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
  }
}
