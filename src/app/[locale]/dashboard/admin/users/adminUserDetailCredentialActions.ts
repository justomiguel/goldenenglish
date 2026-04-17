"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary, defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  logServerAuthzDenied,
  logServerActionException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const S = "adminUserDetailCredentialActions";

const localeZ = z.string().min(2).max(8);
const uuidZ = z.string().uuid();

const passwordSchema = z.object({
  locale: localeZ,
  targetUserId: uuidZ,
  password: z.string().min(8).max(72),
  confirmed: z.literal(true),
});

export async function setAdminUserPasswordFromDetailAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let locale: AppLocale = defaultLocale;
  try {
    const parsed = passwordSchema.safeParse(raw);
    if (!parsed.success) {
      const dict = await getDictionary(defaultLocale);
      return { ok: false, message: dict.admin.users.detailErrPasswordPolicy };
    }
    locale = locales.includes(parsed.data.locale as AppLocale) ? (parsed.data.locale as AppLocale) : defaultLocale;
    const dict = await getDictionary(locale);
    try {
      await assertAdmin();
    } catch {
      logServerAuthzDenied(`${S}:setPassword`);
      return { ok: false, message: dict.admin.users.detailErrForbidden };
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(parsed.data.targetUserId, {
      password: parsed.data.password,
    });
    if (error) {
      logSupabaseClientError(`${S}:setPassword`, error, { targetUserId: parsed.data.targetUserId });
      return { ok: false, message: dict.admin.users.detailErrSave };
    }
    void recordSystemAudit({
      action: "admin_user_detail_set_password",
      resourceType: "auth_user",
      resourceId: parsed.data.targetUserId,
      payload: {},
    });
    revalidatePath(`/${locale}/dashboard/admin/users/${parsed.data.targetUserId}`);
    return { ok: true, message: dict.admin.users.detailToastPasswordSet };
  } catch (e) {
    logServerActionException(S, e, { op: "setPassword" });
    const dict = await getDictionary(locale);
    return { ok: false, message: dict.admin.users.detailErrSave };
  }
}

const tutorSchema = z.object({
  locale: localeZ,
  studentId: uuidZ,
  newTutorId: uuidZ,
});

export async function replaceMinorStudentTutorFromDetailAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let locale: AppLocale = defaultLocale;
  try {
    const parsed = tutorSchema.safeParse(raw);
    if (!parsed.success) {
      const dict = await getDictionary(defaultLocale);
      return { ok: false, message: dict.admin.users.detailErrInvalid };
    }
    locale = locales.includes(parsed.data.locale as AppLocale) ? (parsed.data.locale as AppLocale) : defaultLocale;
    const dict = await getDictionary(locale);
    try {
      await assertAdmin();
    } catch {
      logServerAuthzDenied(`${S}:replaceTutor`);
      return { ok: false, message: dict.admin.users.detailErrForbidden };
    }

    const { studentId, newTutorId } = parsed.data;
    if (studentId === newTutorId) {
      return { ok: false, message: dict.admin.users.detailErrTutorSelf };
    }

    const admin = createAdminClient();
    const { data: stu, error: stuErr } = await admin
      .from("profiles")
      .select("role, is_minor")
      .eq("id", studentId)
      .single();
    if (stuErr || !stu) return { ok: false, message: dict.admin.users.detailErrSave };
    if (String(stu.role) !== "student" || stu.is_minor !== true) {
      return { ok: false, message: dict.admin.users.detailErrNotMinorStudent };
    }

    const { data: tutor, error: tuErr } = await admin.from("profiles").select("role").eq("id", newTutorId).single();
    if (tuErr || !tutor || String(tutor.role) !== "parent") {
      return { ok: false, message: dict.admin.users.detailErrTutorNotParent };
    }

    const { error: delErr } = await admin.from("tutor_student_rel").delete().eq("student_id", studentId);
    if (delErr) {
      logSupabaseClientError(`${S}:tutorDelete`, delErr, { studentId });
      return { ok: false, message: dict.admin.users.detailErrSave };
    }
    const { error: insErr } = await admin.from("tutor_student_rel").insert({
      tutor_id: newTutorId,
      student_id: studentId,
    });
    if (insErr) {
      logSupabaseClientError(`${S}:tutorInsert`, insErr, { studentId, newTutorId });
      return { ok: false, message: dict.admin.users.detailErrSave };
    }

    void recordSystemAudit({
      action: "admin_user_detail_replace_tutor",
      resourceType: "tutor_student_rel",
      resourceId: studentId,
      payload: { newTutorId },
    });
    revalidatePath(`/${locale}/dashboard/admin/users/${studentId}`);
    return { ok: true, message: dict.admin.users.detailToastTutorSaved };
  } catch (e) {
    logServerActionException(S, e, { op: "replaceTutor" });
    const dict = await getDictionary(locale);
    return { ok: false, message: dict.admin.users.detailErrSave };
  }
}
