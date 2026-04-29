"use server";

import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { adminActionDict } from "@/lib/i18n/actionErrors";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { auditAcademicAction } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  badgeCreateSchema,
  localeForBadgeRevalidate,
  revalidateAdminAndPublicBadges,
  upsertBadgeTranslations,
  type BadgeActionResult,
  type BadgeCreateInput,
} from "@/app/[locale]/dashboard/admin/badges/actionShared";

export async function createBadgeAction(raw: BadgeCreateInput): Promise<BadgeActionResult> {
  const ae = await adminActionDict(localeForBadgeRevalidate(raw?.locale ?? defaultLocale));
  const parsed = badgeCreateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: ae.invalidData };
  try {
    const { user } = await assertAdmin();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("badge_catalog")
      .insert({
        code: parsed.data.code,
        category: parsed.data.category,
        criteria_type: parsed.data.criteriaType,
        criteria_threshold: parsed.data.criteriaThreshold,
        sort_order: parsed.data.sortOrder,
        is_active: true,
        updated_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) {
      logSupabaseClientError("createBadgeAction", error, { code: parsed.data.code });
      return { ok: false, message: ae.saveFailed };
    }
    const badgeId = data.id as string;
    const trRes = await upsertBadgeTranslations(badgeId, parsed.data.translations);
    if (!trRes.ok) {
      await admin.from("badge_catalog").delete().eq("id", badgeId);
      return { ok: false, message: ae.saveFailed };
    }
    void auditAcademicAction({
      actorId: user.id,
      actorRole: "admin",
      action: "create",
      resourceType: "badge_catalog",
      resourceId: badgeId,
      summary: `Admin created student badge ${parsed.data.code}`,
      afterValues: {
        code: parsed.data.code,
        category: parsed.data.category,
        criteria_type: parsed.data.criteriaType,
        criteria_threshold: parsed.data.criteriaThreshold,
        sort_order: parsed.data.sortOrder,
      },
    });
    revalidateAdminAndPublicBadges(parsed.data.locale);
    return { ok: true, badgeId };
  } catch (err) {
    logServerException("createBadgeAction", err);
    return { ok: false, message: ae.forbidden };
  }
}
