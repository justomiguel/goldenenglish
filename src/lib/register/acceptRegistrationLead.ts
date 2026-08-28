import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeDni } from "@/lib/import/studentImportUtils";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { createAcceptedStudentWithOptionalTutor } from "@/lib/register/createAcceptedStudentWithOptionalTutor";
import { insertEnrollmentIfMissing } from "@/lib/import/bulkImportEnrollment";
import { resolveCourseIdForRegistrationAccept } from "@/lib/register/resolveCourseIdForRegistrationAccept";
import { isRegistrationUndecidedStored } from "@/lib/register/registrationSectionConstants";
import { registrationIsActionable } from "@/lib/register/registrationIsActionable";
import { localizeRegistrationAcceptError } from "@/lib/register/localizeRegistrationAcceptError";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { failAfterStudentCreated } from "@/lib/register/acceptRegistrationHelpers";
import { resolveExistingStudentByDni } from "@/lib/register/resolveExistingStudentByDni";
import { finalizeAcceptedRegistrationLead } from "@/lib/register/finalizeAcceptedRegistrationLead";
import type { Dictionary } from "@/types/i18n";

export type AcceptRegistrationLeadResult =
  | { ok: true; studentId: string; pendingSectionIds: string[] }
  | { ok: false; message: string };

export async function acceptRegistrationLead(input: {
  admin: SupabaseClient;
  enrollClient: SupabaseClient;
  locale: string;
  dict: Dictionary;
  registrationId: string;
  password?: string;
  birthDate?: string;
  paidCapture?: boolean;
  enrollServiceRole?: boolean;
  waiveReason?: string;
}): Promise<AcceptRegistrationLeadResult> {
  const { admin, dict } = input;
  const { data: reg, error: fetchErr } = await admin
    .from("registrations")
    .select(
      "id,status,first_name,last_name,dni,email,phone,birth_date,level_interest,preferred_section_id,additional_section_ids,tutor_name,tutor_dni,tutor_email,tutor_phone,tutor_relationship,tenant_extras,fee_snapshot",
    )
    .eq("id", input.registrationId)
    .maybeSingle();

  if (fetchErr) {
    logSupabaseClientError("acceptRegistrationLead:select", fetchErr, {
      registrationId: input.registrationId,
    });
    return { ok: false, message: localizeRegistrationAcceptError(dict, "not_found") };
  }
  if (!reg) {
    return { ok: false, message: localizeRegistrationAcceptError(dict, "not_found") };
  }
  if (!registrationIsActionable(reg.status ?? "")) {
    return { ok: false, message: localizeRegistrationAcceptError(dict, "already_processed") };
  }

  const explicitPwd = input.password?.trim() ?? "";
  const pwd = explicitPwd.length >= 6 ? explicitPwd : normalizeDni(String(reg.dni)).password;
  const birthFromForm = input.birthDate?.trim();
  const birthFromReg =
    reg.birth_date != null && String(reg.birth_date).trim() !== ""
      ? String(reg.birth_date).trim().slice(0, 10)
      : undefined;
  const birth = birthFromForm || birthFromReg;
  if (!birth || !/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
    return { ok: false, message: localizeRegistrationAcceptError(dict, "birth_date_required") };
  }

  const legalAge = getLegalAgeMajorityFromSystem();
  const isMinor = fullYearsFromIsoDate(birth) < legalAge;
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
      return { ok: false, message: localizeRegistrationAcceptError(dict, "minor_requires_tutor_dni") };
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
    reg.preferred_section_id != null && String(reg.preferred_section_id).trim() !== "";
  const applicantUndecided =
    !hasPreferredSection && isRegistrationUndecidedStored(levelRaw);

  const courseId = await resolveCourseIdForRegistrationAccept(admin, {
    preferredSectionId: hasPreferredSection ? String(reg.preferred_section_id) : null,
    levelInterestFallback: applicantUndecided ? null : levelRaw,
  });

  let studentId: string;
  if (reuseStudent) {
    studentId = identity.studentId;
  } else {
    const created = await createAcceptedStudentWithOptionalTutor({
      admin,
      dict,
      locale: input.locale,
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

  return finalizeAcceptedRegistrationLead({
    admin,
    enrollClient: input.enrollClient,
    locale: input.locale,
    dict,
    registration: reg,
    studentId,
    reuseStudent,
    isMinor,
    courseId,
    applicantUndecided,
    paidCapture: input.paidCapture,
    enrollServiceRole: input.enrollServiceRole,
    waiveReason: input.waiveReason,
  });
}
