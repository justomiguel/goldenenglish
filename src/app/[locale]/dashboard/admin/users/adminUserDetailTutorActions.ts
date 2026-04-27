"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary, defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  ensureParentProfileByTutorDni,
  upsertTutorStudentLink,
} from "@/lib/register/ensureParentProfileByTutorDni";
import {
  logServerAuthzDenied,
  logServerActionException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const S = "adminUserDetailTutorActions";

const localeZ = z.string().min(2).max(8);
const uuidZ = z.string().uuid();

const linkSchema = z.object({
  locale: localeZ,
  studentId: uuidZ,
  newTutorId: uuidZ,
});

const createLinkSchema = z.object({
  locale: localeZ,
  studentId: uuidZ,
  tutorDni: z.string().min(1).max(64),
  tutorFirstName: z.string().min(1).max(120),
  tutorLastName: z.string().min(1).max(120),
  tutorEmail: z.union([z.string().email().max(320), z.literal("")]),
  tutorPhone: z.string().max(40).optional(),
  relationship: z.string().max(120).optional().nullable(),
});

export async function upsertAdminStudentTutorLinkAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let locale: AppLocale = defaultLocale;
  try {
    const parsed = linkSchema.safeParse(raw);
    if (!parsed.success) {
      const dict = await getDictionary(defaultLocale);
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

    const { studentId, newTutorId } = parsed.data;
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
    if (tuErr || !tutor || String(tutor.role) !== "parent") {
      return { ok: false, message: dict.admin.users.detailErrTutorNotParent };
    }

    const linkRes = await upsertTutorStudentLink(admin, newTutorId, studentId, null);
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
      payload: { tutorId: newTutorId },
    });
    revalidatePath(`/${locale}/dashboard/admin/users/${studentId}`);
    return { ok: true, message: dict.admin.users.detailToastTutorSaved };
  } catch (e) {
    logServerActionException(S, e, { op: "upsertTutorLink" });
    const dict = await getDictionary(locale);
    return { ok: false, message: dict.admin.users.detailErrSave };
  }
}

export async function createAdminParentAndLinkStudentAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let locale: AppLocale = defaultLocale;
  try {
    const parsed = createLinkSchema.safeParse(raw);
    if (!parsed.success) {
      const dict = await getDictionary(defaultLocale);
      return { ok: false, message: dict.admin.users.detailErrInvalid };
    }
    locale = locales.includes(parsed.data.locale as AppLocale) ? (parsed.data.locale as AppLocale) : defaultLocale;
    const dict = await getDictionary(locale);
    const L = dict.admin.users;
    try {
      await assertAdmin();
    } catch {
      logServerAuthzDenied(`${S}:createParentLink`);
      return { ok: false, message: L.detailErrForbidden };
    }

    const { studentId, tutorDni, tutorFirstName, tutorLastName, tutorEmail, tutorPhone, relationship } =
      parsed.data;

    const admin = createAdminClient();
    const { data: stu, error: stuErr } = await admin.from("profiles").select("role").eq("id", studentId).single();
    if (stuErr || !stu || String(stu.role) !== "student") {
      return { ok: false, message: L.detailErrSave };
    }

    const ensured = await ensureParentProfileByTutorDni(admin, {
      tutorDniRaw: tutorDni,
      tutorEmail: tutorEmail.trim() ? tutorEmail.trim() : null,
      tutorPhone: tutorPhone?.trim() ? tutorPhone : null,
      tutorFirstName: tutorFirstName.trim(),
      tutorLastName: tutorLastName.trim(),
    });
    if (!ensured.ok) {
      const code = ensured.message;
      if (code === "tutor_dni_required") return { ok: false, message: L.detailTutorCreateErrDniRequired };
      if (code === "tutor_dni_in_use_by_student") return { ok: false, message: L.detailTutorCreateErrDniStudent };
      if (code === "auth_failed" || code === "no_user_returned") return { ok: false, message: L.detailTutorCreateErrAuth };
      return { ok: false, message: L.detailErrSave };
    }

    if (studentId === ensured.parentId) {
      return { ok: false, message: L.detailErrTutorSelf };
    }

    const linkRes = await upsertTutorStudentLink(admin, ensured.parentId, studentId, relationship ?? null);
    if (!linkRes.ok) {
      logSupabaseClientError(`${S}:tutorUpsertAfterCreate`, { message: linkRes.message ?? "link_failed" }, {
        studentId,
        parentId: ensured.parentId,
      });
      return { ok: false, message: L.detailErrSave };
    }

    void recordSystemAudit({
      action: "admin_user_detail_create_parent_link",
      resourceType: "tutor_student_rel",
      resourceId: studentId,
      payload: { parentId: ensured.parentId },
    });
    revalidatePath(`/${locale}/dashboard/admin/users/${studentId}`);
    return { ok: true, message: L.detailToastTutorCreatedLinked };
  } catch (e) {
    logServerActionException(S, e, { op: "createParentLink" });
    const dict = await getDictionary(locale);
    return { ok: false, message: dict.admin.users.detailErrSave };
  }
}
