"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { normalizeDni } from "@/lib/import/studentImportUtils";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { createAcceptedStudentWithOptionalTutor } from "@/lib/register/createAcceptedStudentWithOptionalTutor";
import { insertEnrollmentIfMissing } from "@/lib/import/bulkImportEnrollment";
import { resolveCourseIdForRegistrationAccept } from "@/lib/register/resolveCourseIdForRegistrationAccept";
import { isRegistrationUndecidedStored } from "@/lib/register/registrationSectionConstants";
import { registrationIsActionable } from "@/lib/register/registrationIsActionable";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizeRegistrationAcceptError } from "@/lib/register/localizeRegistrationAcceptError";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  acceptRegistrationSchema,
  failAfterStudentCreated,
  type AcceptRegistrationInput,
} from "@/lib/register/acceptRegistrationHelpers";
import { resolveExistingStudentByDni } from "@/lib/register/resolveExistingStudentByDni";
import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";
import { enrollRequestedSectionsOnAccept } from "@/lib/register/enrollRequestedSectionsOnAccept";

export type AcceptRegistrationResult =
  | { ok: true; studentId: string; pendingSectionIds: string[] }
  | { ok: false; message: string };

export async function acceptRegistration(
  locale: string,
  raw: AcceptRegistrationInput,
): Promise<AcceptRegistrationResult> {
  let session: SupabaseClient;
  try {
    ({ supabase: session } = await assertAdmin());
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
      "id,status,first_name,last_name,dni,email,phone,birth_date,level_interest,preferred_section_id,additional_section_ids,tutor_name,tutor_dni,tutor_email,tutor_phone,tutor_relationship",
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
  if (!registrationIsActionable(reg.status ?? "")) {
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

  const identity = await resolveExistingStudentByDni(admin, String(reg.dni));
  if (identity.kind === "occupied") {
    return { ok: false, message: dict.register.documentInUse };
  }
  const reuseStudent = identity.kind === "student";

  if (isMinor && !reuseStudent) {
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

  let studentId: string;
  if (reuseStudent) {
    studentId = identity.studentId;
  } else {
    const created = await createAcceptedStudentWithOptionalTutor({
      admin,
      dict,
      locale,
      registrationId: String(reg.id),
      email: String(reg.email),
      password: pwd,
      firstName: String(reg.first_name),
      lastName: String(reg.last_name),
      dni: String(reg.dni),
      phone,
      birth,
      isMinor,
      tutorDni,
      tutorNameRaw,
      tutorEmail: reg.tutor_email != null ? String(reg.tutor_email) : null,
      tutorPhone: reg.tutor_phone != null ? String(reg.tutor_phone) : null,
      tutorRelationship:
        reg.tutor_relationship != null ? String(reg.tutor_relationship) : null,
    });
    if (!created.ok) return created;
    studentId = created.studentId;
  }

  if (courseId) {
    const enrollRes = await insertEnrollmentIfMissing(admin, studentId, courseId);
    if (!enrollRes.ok) {
      if (reuseStudent) {
        return {
          ok: false,
          message: localizeRegistrationAcceptError(dict, enrollRes.message ?? "enrollment_failed"),
        };
      }
      return failAfterStudentCreated(
        admin,
        String(reg.id),
        studentId,
        enrollRes.message ?? "enrollment_failed",
        dict,
      );
    }
  }

  const additionalSectionIds = Array.isArray(reg.additional_section_ids)
    ? (reg.additional_section_ids as string[]).map(String)
    : [];
  const pendingSectionIds = await enrollRequestedSectionsOnAccept(
    session,
    studentId,
    requestedRegistrationSectionIds({
      preferred_section_id:
        reg.preferred_section_id != null ? String(reg.preferred_section_id) : null,
      additionalSectionIds,
    }),
  );

  const { error: upErr } = await admin
    .from("registrations")
    .update({ status: "enrolled" })
    .eq("id", reg.id);

  if (upErr) {
    if (reuseStudent) {
      return { ok: false, message: localizeRegistrationAcceptError(dict, "save_failed") };
    }
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
  revalidateAcademicSurfaces(locale);
  return { ok: true, studentId, pendingSectionIds };
}
