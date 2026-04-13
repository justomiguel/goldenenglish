"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { createDashboardUser } from "@/app/[locale]/dashboard/admin/users/actions";
import { normalizeDni } from "@/lib/import/studentImportUtils";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { splitTutorDisplayName } from "@/lib/register/tutorDisplayNameParts";
import {
  ensureParentProfileByTutorDni,
  upsertTutorStudentLink,
} from "@/lib/register/ensureParentProfileByTutorDni";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  insertEnrollmentIfMissing,
  resolveCourseIdFromLevelInterest,
} from "@/lib/import/bulkImportEnrollment";
import { compensateDeleteStudentAuthUser } from "@/lib/register/compensateStudentAuthUser";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Dictionary } from "@/types/i18n";
import { localizeRegistrationAcceptError } from "@/lib/register/localizeRegistrationAcceptError";

const idZ = z.string().uuid();

const acceptSchema = z.object({
  registration_id: idZ,
  password: z.string().max(72).optional(),
  birth_date: z
    .string()
    .trim()
    .optional()
    .transform((s) => (s === "" || s == null ? undefined : s))
    .pipe(z.union([z.undefined(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])),
});

async function failAfterStudentCreated(
  admin: SupabaseClient,
  registrationId: string,
  studentId: string,
  primaryCode: string,
  dict: Dictionary,
): Promise<{ ok: false; message: string }> {
  const roll = await compensateDeleteStudentAuthUser(admin, studentId);
  if (!roll.ok) {
    void recordSystemAudit({
      action: "registration_accept_rollback_failed",
      resourceType: "registration",
      resourceId: registrationId,
      payload: { student_id: studentId, intended_error: primaryCode },
    });
    return {
      ok: false,
      message: localizeRegistrationAcceptError(dict, "rollback_failed"),
    };
  }
  return { ok: false, message: localizeRegistrationAcceptError(dict, primaryCode) };
}

export type AcceptRegistrationResult =
  | { ok: true; studentId: string }
  | { ok: false; message: string };

export async function acceptRegistration(
  locale: string,
  raw: z.infer<typeof acceptSchema>,
): Promise<AcceptRegistrationResult> {
  try {
    await assertAdmin();
  } catch {
    return {
      ok: false,
      message: localizeRegistrationAcceptError(await getDictionary(locale), "forbidden"),
    };
  }

  const parsed = acceptSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: localizeRegistrationAcceptError(await getDictionary(locale), "invalid_data"),
    };
  }

  const dict = await getDictionary(locale);
  const admin = createAdminClient();
  const { data: reg, error: fetchErr } = await admin
    .from("registrations")
    .select(
      "id,status,first_name,last_name,dni,email,phone,birth_date,level_interest,tutor_name,tutor_dni,tutor_email,tutor_phone,tutor_relationship",
    )
    .eq("id", parsed.data.registration_id)
    .maybeSingle();

  if (fetchErr || !reg) {
    return { ok: false, message: localizeRegistrationAcceptError(dict, "not_found") };
  }
  if (reg.status !== "new") {
    return { ok: false, message: localizeRegistrationAcceptError(dict, "already_processed") };
  }

  const explicitPwd = parsed.data.password?.trim() ?? "";
  const pwd = explicitPwd.length >= 6
    ? explicitPwd
    : normalizeDni(String(reg.dni)).password;
  const birthFromForm = parsed.data.birth_date?.trim();
  const birthFromReg =
    reg.birth_date != null && String(reg.birth_date).trim() !== ""
      ? String(reg.birth_date).trim().slice(0, 10)
      : undefined;
  const birth = birthFromForm || birthFromReg;
  if (!birth || !/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
    return { ok: false, message: localizeRegistrationAcceptError(dict, "birth_date_required") };
  }

  const legalAge = getLegalAgeMajorityFromSystem();
  const ageYears = fullYearsFromIsoDate(birth);
  const isMinor = ageYears < legalAge;

  const phone =
    (reg.phone != null ? String(reg.phone).trim() : "") || dict.common.emptyValue;

  const tutorDni = reg.tutor_dni != null ? String(reg.tutor_dni).trim() : "";
  const tutorNameRaw = reg.tutor_name != null ? String(reg.tutor_name) : "";

  if (isMinor) {
    if (!tutorDni) {
      return {
        ok: false,
        message: localizeRegistrationAcceptError(dict, "minor_requires_tutor_dni"),
      };
    }
    if (tutorDni.toLowerCase() === String(reg.dni).trim().toLowerCase()) {
      return {
        ok: false,
        message: localizeRegistrationAcceptError(dict, "tutor_dni_same_as_student"),
      };
    }
  }

  const courseId = await resolveCourseIdFromLevelInterest(
    admin,
    reg.level_interest != null ? String(reg.level_interest) : null,
  );
  if (!courseId) {
    return { ok: false, message: localizeRegistrationAcceptError(dict, "no_course_for_level") };
  }

  const createRes = await createDashboardUser({
    email: String(reg.email),
    password: pwd,
    role: "student",
    first_name: String(reg.first_name),
    last_name: String(reg.last_name),
    dni_or_passport: String(reg.dni),
    phone,
    birth_date: birth,
    locale,
  });

  if (!createRes.ok) {
    return { ok: false, message: createRes.message ?? localizeRegistrationAcceptError(dict, "save_failed") };
  }
  const studentId = createRes.userId;
  if (!studentId) {
    return { ok: false, message: localizeRegistrationAcceptError(dict, "no_user_returned") };
  }

  if (isMinor) {
    const { firstName: tf, lastName: tl } = splitTutorDisplayName(tutorNameRaw, {
      defaultFirstName: dict.admin.registrations.tutorAccountDefaultFirst,
      emptyLastName: dict.admin.registrations.emptyValue,
    });
    const parentRes = await ensureParentProfileByTutorDni(admin, {
      tutorDniRaw: tutorDni,
      tutorEmail: reg.tutor_email != null ? String(reg.tutor_email) : null,
      tutorPhone: reg.tutor_phone != null ? String(reg.tutor_phone) : null,
      tutorFirstName: tf,
      tutorLastName: tl,
    });
    if (!parentRes.ok) {
      return failAfterStudentCreated(
        admin,
        String(reg.id),
        studentId,
        parentRes.message,
        dict,
      );
    }
    const rel =
      reg.tutor_relationship != null ? String(reg.tutor_relationship) : null;
    const linkRes = await upsertTutorStudentLink(
      admin,
      parentRes.parentId,
      studentId,
      rel,
    );
    if (!linkRes.ok) {
      return failAfterStudentCreated(
        admin,
        String(reg.id),
        studentId,
        linkRes.message ?? "link_failed",
        dict,
      );
    }
  }

  const enrollRes = await insertEnrollmentIfMissing(admin, studentId, courseId);
  if (!enrollRes.ok) {
    return failAfterStudentCreated(
      admin,
      String(reg.id),
      studentId,
      enrollRes.message ?? "enrollment_failed",
      dict,
    );
  }

  const { error: upErr } = await admin
    .from("registrations")
    .update({ status: "enrolled" })
    .eq("id", reg.id);

  if (upErr) {
    return failAfterStudentCreated(admin, String(reg.id), studentId, "save_failed", dict);
  }

  void recordSystemAudit({
    action: "registration_accept_enroll",
    resourceType: "registration",
    resourceId: String(reg.id),
    payload: {
      student_id: studentId,
      minor: isMinor,
      course_id: courseId,
    },
  });

  revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
  return { ok: true, studentId };
}
