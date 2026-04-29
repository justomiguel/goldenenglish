"use server";

import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { adminActionDict } from "@/lib/i18n/actionErrors";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { auditAcademicAction } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BadgeCategory, BadgeCriteriaType } from "@/lib/badges/badgeCatalog";
import {
  badgeArchiveSchema,
  badgeUpdateSchema,
  localeForBadgeRevalidate,
  revalidateAdminAndPublicBadges,
  upsertBadgeTranslations,
  type BadgeActionResult,
  type BadgeArchiveInput,
  type BadgeUpdateInput,
} from "@/app/[locale]/dashboard/admin/badges/actionShared";

export async function updateBadgeAction(raw: BadgeUpdateInput): Promise<BadgeActionResult> {
  const ae = await adminActionDict(localeForBadgeRevalidate(raw?.locale ?? defaultLocale));
  const parsed = badgeUpdateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: ae.invalidData };
  try {
    const { user } = await assertAdmin();
    const admin = createAdminClient();
    const { data: before } = await admin
      .from("badge_catalog")
      .select("id, code, category, criteria_type, criteria_threshold, sort_order")
      .eq("id", parsed.data.badgeId)
      .maybeSingle();
    const { error } = await admin
      .from("badge_catalog")
      .update({
        category: parsed.data.category,
        criteria_type: parsed.data.criteriaType,
        criteria_threshold: parsed.data.criteriaThreshold,
        sort_order: parsed.data.sortOrder,
        updated_by: user.id,
      })
      .eq("id", parsed.data.badgeId);
    if (error) {
      logSupabaseClientError("updateBadgeAction", error, { badgeId: parsed.data.badgeId });
      return { ok: false, message: ae.saveFailed };
    }
    const trRes = await upsertBadgeTranslations(parsed.data.badgeId, parsed.data.translations);
    if (!trRes.ok) return { ok: false, message: ae.saveFailed };
    void auditAcademicAction({
      actorId: user.id,
      actorRole: "admin",
      action: "update",
      resourceType: "badge_catalog",
      resourceId: parsed.data.badgeId,
      summary: `Admin updated student badge ${before?.code ?? parsed.data.badgeId}`,
      beforeValues: before
        ? {
            category: before.category as BadgeCategory,
            criteria_type: before.criteria_type as BadgeCriteriaType,
            criteria_threshold: Number(before.criteria_threshold),
            sort_order: Number(before.sort_order),
          }
        : {},
      afterValues: {
        category: parsed.data.category,
        criteria_type: parsed.data.criteriaType,
        criteria_threshold: parsed.data.criteriaThreshold,
        sort_order: parsed.data.sortOrder,
      },
    });
    revalidateAdminAndPublicBadges(parsed.data.locale);
    return { ok: true, badgeId: parsed.data.badgeId };
  } catch (err) {
    logServerException("updateBadgeAction", err);
    return { ok: false, message: ae.forbidden };
  }
}

export async function setBadgeActiveAction(raw: BadgeArchiveInput): Promise<BadgeActionResult> {
  const ae = await adminActionDict(localeForBadgeRevalidate(raw?.locale ?? defaultLocale));
  const parsed = badgeArchiveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: ae.invalidData };
  try {
    const { user } = await assertAdmin();
    const admin = createAdminClient();
    const { data: before } = await admin
      .from("badge_catalog")
      .select("id, code, is_active")
      .eq("id", parsed.data.badgeId)
      .maybeSingle();
    const { error } = await admin
      .from("badge_catalog")
      .update({ is_active: parsed.data.isActive, updated_by: user.id })
      .eq("id", parsed.data.badgeId);
    if (error) {
      logSupabaseClientError("setBadgeActiveAction", error, { badgeId: parsed.data.badgeId });
      return { ok: false, message: ae.saveFailed };
    }
    void auditAcademicAction({
      actorId: user.id,
      actorRole: "admin",
      action: parsed.data.isActive ? "restore" : "archive",
      resourceType: "badge_catalog",
      resourceId: parsed.data.badgeId,
      summary: `Admin ${parsed.data.isActive ? "activated" : "paused"} student badge ${before?.code ?? parsed.data.badgeId}`,
      beforeValues: { is_active: Boolean(before?.is_active) },
      afterValues: { is_active: parsed.data.isActive },
    });
    revalidateAdminAndPublicBadges(parsed.data.locale);
    return { ok: true, badgeId: parsed.data.badgeId };
  } catch (err) {
    logServerException("setBadgeActiveAction", err);
    return { ok: false, message: ae.forbidden };
  }
}
