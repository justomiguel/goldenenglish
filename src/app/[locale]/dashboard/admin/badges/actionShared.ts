import { revalidatePath } from "next/cache";
import { z } from "zod";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";
import { BADGE_CATEGORIES, BADGE_CRITERIA_TYPES } from "@/lib/badges/badgeCatalog";

export const badgeCodeSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9_]+$/, "code must be lowercase letters, digits or underscores");

export const badgeLocalesSchema = z.object({
  en: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(600),
  }),
  es: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(600),
  }),
});

export const badgeCreateSchema = z.object({
  locale: z.string().min(2),
  code: badgeCodeSchema,
  category: z.enum(BADGE_CATEGORIES),
  criteriaType: z.enum(BADGE_CRITERIA_TYPES),
  criteriaThreshold: z.number().int().min(0).max(10000),
  sortOrder: z.number().int().min(0).max(10000).default(100),
  translations: badgeLocalesSchema,
});

export const badgeUpdateSchema = z.object({
  locale: z.string().min(2),
  badgeId: z.string().uuid(),
  category: z.enum(BADGE_CATEGORIES),
  criteriaType: z.enum(BADGE_CRITERIA_TYPES),
  criteriaThreshold: z.number().int().min(0).max(10000),
  sortOrder: z.number().int().min(0).max(10000),
  translations: badgeLocalesSchema,
});

export const badgeArchiveSchema = z.object({
  locale: z.string().min(2),
  badgeId: z.string().uuid(),
  isActive: z.boolean(),
});

export type BadgeCreateInput = z.infer<typeof badgeCreateSchema>;
export type BadgeUpdateInput = z.infer<typeof badgeUpdateSchema>;
export type BadgeArchiveInput = z.infer<typeof badgeArchiveSchema>;

export type BadgeActionResult = { ok: boolean; message?: string; badgeId?: string };

export const ALLOWED_BADGE_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);
export const MAX_BADGE_IMAGE_BYTES = 1024 * 1024 * 2;

export function localeForBadgeRevalidate(locale: string | null | undefined): string {
  return typeof locale === "string" && locale.length >= 2 ? locale : defaultLocale;
}

export function revalidateAdminAndPublicBadges(locale: string): void {
  const safeLocale = localeForBadgeRevalidate(locale);
  revalidatePath(`/${safeLocale}/dashboard/admin/badges`);
  revalidatePath(`/${safeLocale}/dashboard/admin/badges/new`);
  revalidatePath(`/${safeLocale}/dashboard/student/badges`);
  revalidatePath(`/${safeLocale}/dashboard/parent/badges`);
}

export async function upsertBadgeTranslations(
  badgeId: string,
  translations: z.infer<typeof badgeLocalesSchema>,
): Promise<{ ok: boolean }> {
  const admin = createAdminClient();
  const { error } = await admin.from("badge_translations").upsert(
    [
      {
        badge_id: badgeId,
        locale: "en",
        title: translations.en.title,
        description: translations.en.description,
      },
      {
        badge_id: badgeId,
        locale: "es",
        title: translations.es.title,
        description: translations.es.description,
      },
    ],
    { onConflict: "badge_id,locale" },
  );
  if (error) {
    logSupabaseClientError("upsertBadgeTranslations", error, { badgeId });
    return { ok: false };
  }
  return { ok: true };
}
