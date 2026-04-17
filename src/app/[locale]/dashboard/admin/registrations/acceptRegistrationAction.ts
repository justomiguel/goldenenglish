"use server";

import { revalidatePath } from "next/cache";
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
import { insertEnrollmentIfMissing } from "@/lib/import/bulkImportEnrollment";
import { resolveCourseIdForRegistrationAccept } from "@/lib/register/resolveCourseIdForRegistrationAccept";
import { isRegistrationUndecidedStored } from "@/lib/register/registrationSectionConstants";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizeRegistrationAcceptError } from "@/lib/register/localizeRegistrationAcceptError";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  acceptRegistrationSchema,
  failAfterStudentCreated,
  type AcceptRegistrationInput,
} from "@/lib/register/acceptRegistrationHelpers";

export type AcceptRegistrationResult =
  | { ok: true; studentId: string }
  | { ok: false; message: string };

export async function acceptRegistration(
  locale: string,
  raw: AcceptRegistrationInput,
): Promise<AcceptRegistrationResult> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("acceptRegistration");
    return {
      ok: false,
      message: localizeRegistrationAcceptError(await getDictionary(locale), "forbidden"),
    };
  }

  const parsed = acceptRegistrationSchema.safeParse(raw);
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
      "id,status,first_name,last_name,dni,email,phone,birth_date,level_interest,preferred_section_id,tutor_name,tutor_dni,tutor_email,tutor_phone,tutor_relationship",
    )
    .eq("id", parsed.data.registration_id)
    .maybeSingle();

  if (fetchErr) {
    logSupabaseClientError("acceptRegistration:selectRegistration", fetchErr, {
      registrationId: parsed.data.registration_id,
    });
    return { ok: false, message: localizeRegistrationAcceptError(dict, "not_found") };
  }
  if (!reg) {
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

  const levelRaw = reg.level_interest != null ? String(reg.level_interest) : null;
  const hasPreferredSection =
    reg.preferred_section_id != null &&
    String(reg.preferred_section_id).trim() !== "";
  const applicantUndecided =
    !hasPreferredSection && isRegistrationUndecidedStored(levelRaw);

  const courseId = await resolveCourseIdForRegistrationAccept(admin, {
    preferredSectionId: hasPreferredSection
      ? String(reg.preferred_section_id)
      : null,
    levelInterestFallback: applicantUndecided ? null : levelRaw,
  });
  const skipCourseEnrollment = !courseId;

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

  if (courseId) {
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
      course_enrollment_skipped: skipCourseEnrollment,
      course_skip_reason: skipCourseEnrollment
        ? applicantUndecided
          ? "undecided"
          : "no_resolved_course"
        : null,
    },
  });

  revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
  revalidatePath(`/${locale}/dashboard/admin`, "page");
  return { ok: true, studentId };
}
