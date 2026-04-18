"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { parseAdminUserDetailField } from "@/lib/dashboard/adminUserDetailUpdateParse";
import {
  adminUserDetailDictError,
  mergeAuthUserMetadataPatch,
} from "@/lib/dashboard/adminUserDetailServerHelpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary, defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  logServerAuthzDenied,
  logServerActionException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const S = "adminUserDetailProfileActions";

import type { AdminParentSearchHit } from "@/types/adminUsers";

const localeZ = z.string().min(2).max(8);
const uuidZ = z.string().uuid();

export async function searchAdminParentsForDetailAction(query: string): Promise<AdminParentSearchHit[]> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied(`${S}:searchParents`);
    return [];
  }
  const q = query.trim();
  if (q.length < 2) return [];
  const admin = createAdminClient();
  const pat = `%${q}%`;
  const [r1, r2] = await Promise.all([
    admin.from("profiles").select("id, first_name, last_name, role").eq("role", "parent").ilike("first_name", pat).limit(8),
    admin.from("profiles").select("id, first_name, last_name, role").eq("role", "parent").ilike("last_name", pat).limit(8),
  ]);
  const map = new Map<string, AdminParentSearchHit>();
  for (const r of [r1, r2]) {
    if (r.error || !r.data) continue;
    for (const p of r.data) {
      const id = String(p.id);
      map.set(id, { id, label: `${p.first_name} ${p.last_name}`.trim() });
    }
  }
  return [...map.values()].slice(0, 12);
}

const updatableFieldZ = z.enum([
  "email",
  "firstName",
  "lastName",
  "phone",
  "dniOrPassport",
  "birthDate",
  "role",
]);

const updateFieldSchema = z.object({
  locale: localeZ,
  targetUserId: uuidZ,
  field: updatableFieldZ,
  value: z.string(),
});

export async function updateAdminUserDetailFieldAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let locale: AppLocale = defaultLocale;
  try {
    const parsed = updateFieldSchema.safeParse(raw);
    if (!parsed.success) {
      const dict = await getDictionary(defaultLocale);
      return { ok: false, message: dict.admin.users.detailErrInvalid };
    }
    locale = locales.includes(parsed.data.locale as AppLocale) ? (parsed.data.locale as AppLocale) : defaultLocale;
    const dict = await getDictionary(locale);
    try {
      await assertAdmin();
    } catch {
      logServerAuthzDenied(`${S}:updateField`);
      return { ok: false, message: dict.admin.users.detailErrForbidden };
    }
    const { targetUserId, field, value } = parsed.data;

    const parsedField = parseAdminUserDetailField(field, value);
    if (!parsedField.ok) {
      return { ok: false, message: adminUserDetailDictError(dict, parsedField.code) };
    }

    const admin = createAdminClient();

    if (field === "email") {
      const nextEmail = parsedField.normalized as string;
      const { error } = await admin.auth.admin.updateUserById(targetUserId, {
        email: nextEmail,
        email_confirm: true,
      });
      if (error) {
        logSupabaseClientError(`${S}:updateEmail`, error, { targetUserId });
        const m = error.message.toLowerCase();
        if (m.includes("already") || m.includes("registered") || m.includes("unique")) {
          return { ok: false, message: dict.admin.users.detailErr_email_taken };
        }
        return { ok: false, message: dict.admin.users.detailErrSave };
      }
      void recordSystemAudit({
        action: "admin_user_detail_update_email",
        resourceType: "auth_user",
        resourceId: targetUserId,
        payload: {},
      });
      revalidatePath(`/${locale}/dashboard/admin/users/${targetUserId}`);
      return { ok: true, message: dict.admin.users.detailToastSaved };
    }

    const profilePatch: Record<string, unknown> = {};
    const metaPatch: Record<string, string | null> = {};

    if (field === "firstName") {
      profilePatch.first_name = parsedField.normalized;
      metaPatch.first_name = parsedField.normalized as string;
    } else if (field === "lastName") {
      profilePatch.last_name = parsedField.normalized;
      metaPatch.last_name = parsedField.normalized as string;
    } else if (field === "phone") {
      profilePatch.phone = parsedField.normalized;
      metaPatch.phone = parsedField.normalized as string | null;
    } else if (field === "dniOrPassport") {
      profilePatch.dni_or_passport = parsedField.normalized;
      metaPatch.dni_or_passport = parsedField.normalized as string;
    } else if (field === "birthDate") {
      profilePatch.birth_date = parsedField.normalized;
      metaPatch.birth_date = parsedField.normalized;
    } else if (field === "role") {
      profilePatch.role = parsedField.normalized;
      metaPatch.role = parsedField.normalized as string;
    }

    if (Object.keys(profilePatch).length > 0) {
      const { error: pErr } = await admin.from("profiles").update(profilePatch).eq("id", targetUserId);
      if (pErr) {
        logSupabaseClientError(`${S}:profilesUpdate`, pErr, { targetUserId });
        return { ok: false, message: dict.admin.users.detailErrSave };
      }
    }

    if (Object.keys(metaPatch).length > 0) {
      const m = await mergeAuthUserMetadataPatch(admin, S, targetUserId, metaPatch);
      if (!m.ok) return { ok: false, message: dict.admin.users.detailErrSave };
    }

    void recordSystemAudit({
      action: "admin_user_detail_update_profile",
      resourceType: "profiles",
      resourceId: targetUserId,
      payload: { field },
    });
    revalidatePath(`/${locale}/dashboard/admin/users/${targetUserId}`);
    return { ok: true, message: dict.admin.users.detailToastSaved };
  } catch (e) {
    logServerActionException(S, e, { op: "updateField" });
    const dict = await getDictionary(locale);
    return { ok: false, message: dict.admin.users.detailErrSave };
  }
}
