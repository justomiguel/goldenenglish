"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { adminUserDetailDictError, mergeAuthUserMetadataPatch } from "@/lib/dashboard/adminUserDetailServerHelpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary, defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  logServerAuthzDenied,
  logServerActionException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { normalizeHomeAddressInput } from "@/lib/profile/normalizeHomeAddressInput";
import { loadTutorStudentFamilyClusterIds } from "@/lib/dashboard/loadTutorStudentFamilyClusterIds";

const S = "adminUserDetailProfileHomeAddressActions";

const localeZ = z.string().min(2).max(8);
const uuidZ = z.string().uuid();

const homeAddressUpdateSchema = z.object({
  locale: localeZ,
  targetUserId: uuidZ,
  homeAddressText: z.string(),
  homePlaceId: z.string().nullable(),
  applyToFamily: z.boolean().optional(),
});

export async function updateAdminUserDetailHomeAddressAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let locale: AppLocale = defaultLocale;
  try {
    const parsed = homeAddressUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      const dict = await getDictionary(defaultLocale);
      return { ok: false, message: dict.admin.users.detailErrInvalid };
    }
    locale = locales.includes(parsed.data.locale as AppLocale) ? (parsed.data.locale as AppLocale) : defaultLocale;
    const dict = await getDictionary(locale);
    try {
      await assertAdmin();
    } catch {
      logServerAuthzDenied(`${S}:updateHomeAddress`);
      return { ok: false, message: dict.admin.users.detailErrForbidden };
    }

    const norm = normalizeHomeAddressInput(parsed.data.homeAddressText, parsed.data.homePlaceId);
    if (!norm.ok) {
      return { ok: false, message: adminUserDetailDictError(dict, norm.code) };
    }

    const admin = createAdminClient();
    const profilePatch = {
      home_address_text: norm.value.text,
      home_place_id: norm.value.placeId,
    };

    const applyFamily =
      parsed.data.applyToFamily === true && norm.value.text != null && norm.value.text.length > 0;

    let profileIds = [parsed.data.targetUserId];
    if (applyFamily) {
      profileIds = await loadTutorStudentFamilyClusterIds(admin, parsed.data.targetUserId);
    }

    const profileIdsDedup = [...new Set(profileIds)];

    let pErr: { message?: string } | null = null;
    if (profileIdsDedup.length === 1) {
      const res = await admin.from("profiles").update(profilePatch).eq("id", profileIdsDedup[0]!);
      pErr = res.error;
    } else {
      const res = await admin.from("profiles").update(profilePatch).in("id", profileIdsDedup);
      pErr = res.error;
    }
    if (pErr) {
      logSupabaseClientError(`${S}:profilesUpdateHomeAddress`, pErr, {
        targetUserId: parsed.data.targetUserId,
        affectedCount: profileIdsDedup.length,
      });
      return { ok: false, message: dict.admin.users.detailErrSave };
    }

    const metaPatch: Record<string, string | null> = {
      home_address_text: norm.value.text,
      home_place_id: norm.value.placeId,
    };
    for (const id of profileIdsDedup) {
      const m = await mergeAuthUserMetadataPatch(admin, S, id, metaPatch);
      if (!m.ok) return { ok: false, message: dict.admin.users.detailErrSave };
    }

    void recordSystemAudit({
      action: "admin_user_detail_update_home_address",
      resourceType: "profiles",
      resourceId: parsed.data.targetUserId,
      payload: {
        hasPlaceId: Boolean(norm.value.placeId),
        applyToFamily: profileIdsDedup.length > 1,
        affectedProfileCount: profileIdsDedup.length,
      },
    });
    for (const id of profileIdsDedup) {
      revalidatePath(`/${locale}/dashboard/admin/users/${id}`);
    }
    return { ok: true, message: dict.admin.users.detailToastSaved };
  } catch (e) {
    logServerActionException(S, e, { op: "updateHomeAddress" });
    const dict = await getDictionary(locale);
    return { ok: false, message: dict.admin.users.detailErrSave };
  }
}
