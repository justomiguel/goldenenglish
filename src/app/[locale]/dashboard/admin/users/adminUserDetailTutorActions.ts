"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary, defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  upsertTutorStudentLink,
} from "@/lib/register/ensureParentProfileByTutorDni";
import { profileRoleEligibleAsLinkedStudentGuardian } from "@/lib/register/linkedStudentGuardianProfileRoles";
import { TUTOR_STUDENT_RELATIONSHIP_CODES } from "@/lib/register/tutorStudentRelationship";
import {
  logServerAuthzDenied,
  logServerActionException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const S = "adminUserDetailTutorActions";

const localeZ = z.string().min(2).max(8);
const uuidZ = z.string().uuid();

const tutorRelationshipSchema = z.enum(
  TUTOR_STUDENT_RELATIONSHIP_CODES as unknown as [string, ...string[]],
);

const linkSchema = z.object({
  locale: localeZ,
  studentId: uuidZ,
  newTutorId: uuidZ,
  relationship: tutorRelationshipSchema,
});

const removeLinkSchema = z.object({
  locale: localeZ,
  studentId: uuidZ,
  tutorId: uuidZ,
});

export async function upsertAdminStudentTutorLinkAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let locale: AppLocale = defaultLocale;
  try {
    const parsed = linkSchema.safeParse(raw);
    if (!parsed.success) {
      const dict = await getDictionary(defaultLocale);
      const relErr = parsed.error.flatten().fieldErrors.relationship;
      if (relErr?.length) {
        return { ok: false, message: dict.admin.users.detailErrTutorRelationshipRequired };
      }
      return { ok: false, message: dict.admin.users.detailErrInvalid };
    }
    locale = locales.includes(parsed.data.locale as AppLocale) ? (parsed.data.locale as AppLocale) : defaultLocale;
    const dict = await getDictionary(locale);
    try {
      await assertAdmin();
    } catch {
      logServerAuthzDenied(`${S}:upsertTutorLink`);
      return { ok: false, message: dict.admin.users.detailErrForbidden };
    }

    const { studentId, newTutorId, relationship } = parsed.data;
    if (studentId === newTutorId) {
      return { ok: false, message: dict.admin.users.detailErrTutorSelf };
    }

    const admin = createAdminClient();
    const { data: stu, error: stuErr } = await admin.from("profiles").select("role").eq("id", studentId).single();
    if (stuErr || !stu) return { ok: false, message: dict.admin.users.detailErrSave };
    if (String(stu.role) !== "student") {
      return { ok: false, message: dict.admin.users.detailErrSave };
    }

    const { data: tutor, error: tuErr } = await admin.from("profiles").select("role").eq("id", newTutorId).single();
    if (tuErr || !tutor || !profileRoleEligibleAsLinkedStudentGuardian(tutor.role)) {
      return { ok: false, message: dict.admin.users.detailErrTutorNotParent };
    }

    const linkRes = await upsertTutorStudentLink(admin, newTutorId, studentId, relationship);
    if (!linkRes.ok) {
      logSupabaseClientError(`${S}:tutorUpsert`, { message: linkRes.message ?? "link_failed" }, {
        studentId,
        newTutorId,
      });
      return { ok: false, message: dict.admin.users.detailErrSave };
    }

    void recordSystemAudit({
      action: "admin_user_detail_upsert_tutor_link",
      resourceType: "tutor_student_rel",
      resourceId: studentId,
      payload: { tutorId: newTutorId, relationship },
    });
    revalidatePath(`/${locale}/dashboard/admin/users/${studentId}`);
    revalidatePath(`/${locale}/dashboard/admin/users/${newTutorId}`);
    revalidatePath(`/${locale}/dashboard/admin/users`);
    return { ok: true, message: dict.admin.users.detailToastTutorSaved };
  } catch (e) {
    logServerActionException(S, e, { op: "upsertTutorLink" });
    const dict = await getDictionary(locale);
    return { ok: false, message: dict.admin.users.detailErrSave };
  }
}

export async function removeAdminStudentTutorLinkAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let locale: AppLocale = defaultLocale;
  try {
    const parsed = removeLinkSchema.safeParse(raw);
    if (!parsed.success) {
      const dict = await getDictionary(defaultLocale);
      return { ok: false, message: dict.admin.users.detailErrInvalid };
    }
    locale = locales.includes(parsed.data.locale as AppLocale) ? (parsed.data.locale as AppLocale) : defaultLocale;
    const dict = await getDictionary(locale);
    try {
      await assertAdmin();
    } catch {
      logServerAuthzDenied(`${S}:removeTutorLink`);
      return { ok: false, message: dict.admin.users.detailErrForbidden };
    }

    const { studentId, tutorId } = parsed.data;
    if (studentId === tutorId) {
      return { ok: false, message: dict.admin.users.detailErrTutorSelf };
    }

    const admin = createAdminClient();
    const { data: stu, error: stuErr } = await admin.from("profiles").select("role").eq("id", studentId).single();
    if (stuErr || !stu) return { ok: false, message: dict.admin.users.detailErrSave };
    if (String(stu.role) !== "student") {
      return { ok: false, message: dict.admin.users.detailErrSave };
    }

    const { data: tutor, error: tuErr } = await admin.from("profiles").select("role").eq("id", tutorId).single();
    if (tuErr || !tutor || !profileRoleEligibleAsLinkedStudentGuardian(tutor.role)) {
      return { ok: false, message: dict.admin.users.detailErrTutorNotParent };
    }

    const { data: removed, error: delErr } = await admin
      .from("tutor_student_rel")
      .delete()
      .eq("tutor_id", tutorId)
      .eq("student_id", studentId)
      .select("tutor_id");
    if (delErr) {
      logSupabaseClientError(`${S}:tutorDelete`, delErr, { studentId, tutorId });
      return { ok: false, message: dict.admin.users.detailErrSave };
    }
    if (!removed?.length) {
      return { ok: false, message: dict.admin.users.detailErrTutorLinkNotFound };
    }

    void recordSystemAudit({
      action: "admin_user_detail_remove_tutor_link",
      resourceType: "tutor_student_rel",
      resourceId: studentId,
      payload: { tutorId },
    });
    revalidatePath(`/${locale}/dashboard/admin/users/${studentId}`);
    revalidatePath(`/${locale}/dashboard/admin/users/${tutorId}`);
    revalidatePath(`/${locale}/dashboard/admin/users`);
    return { ok: true, message: dict.admin.users.detailToastTutorUnlinked };
  } catch (e) {
    logServerActionException(S, e, { op: "removeTutorLink" });
    const dict = await getDictionary(locale);
    return { ok: false, message: dict.admin.users.detailErrSave };
  }
}
