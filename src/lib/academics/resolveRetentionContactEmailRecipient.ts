import type { SupabaseClient } from "@supabase/supabase-js";
import {
  logServerActionInvariantViolation,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import type { SendRetentionContactEmailCode } from "@/types/retentionContactEmail";

const S = "sendRetentionContactEmailAction" as const;

export type RetentionEmailRecipientInput = {
  cohortId: string;
  studentId: string;
  enrollmentId: string;
  mailUserId: string;
  isSelfContact: boolean;
};

export type ResolveRetentionRecipientResult =
  | { ok: true; to: string }
  | { ok: false; code: SendRetentionContactEmailCode };

/**
 * Comprueba matrícula, cohorte, vínculo tutor/alumno y resuelve el email de envío.
 */
export async function resolveRetentionContactEmailRecipient(
  admin: SupabaseClient,
  data: RetentionEmailRecipientInput,
): Promise<ResolveRetentionRecipientResult> {
  const { data: enr, error: enrErr } = await admin
    .from("section_enrollments")
    .select("id, student_id, section_id, status")
    .eq("id", data.enrollmentId)
    .maybeSingle();

  if (enrErr) {
    logSupabaseClientError(`${S}:enrollment`, enrErr, { enrollmentId: data.enrollmentId });
    return { ok: false, code: "SEND" };
  }
  if (!enr || (enr as { student_id: string }).student_id !== data.studentId) {
    logServerActionInvariantViolation(S, "enrollment_mismatch", {
      enrollmentId: data.enrollmentId,
      studentId: data.studentId,
    });
    return { ok: false, code: "NOT_FOUND" };
  }

  const st = (enr as { status: string }).status;
  if (st !== "active" && st !== "completed") {
    logServerActionInvariantViolation(S, "enrollment_bad_status", {
      enrollmentId: data.enrollmentId,
      status: st,
    });
    return { ok: false, code: "NOT_FOUND" };
  }

  const { data: sec, error: secErr } = await admin
    .from("academic_sections")
    .select("id, cohort_id, name")
    .eq("id", (enr as { section_id: string }).section_id)
    .maybeSingle();

  if (secErr) {
    logSupabaseClientError(`${S}:section`, secErr, { sectionId: (enr as { section_id: string }).section_id });
    return { ok: false, code: "SEND" };
  }
  if (!sec || (sec as { cohort_id: string }).cohort_id !== data.cohortId) {
    logServerActionInvariantViolation(S, "cohort_mismatch", {
      enrollmentId: data.enrollmentId,
      cohortId: data.cohortId,
    });
    return { ok: false, code: "NOT_FOUND" };
  }

  if (data.isSelfContact) {
    if (data.mailUserId !== data.studentId) {
      logServerActionInvariantViolation(S, "self_mail_user_mismatch", { studentId: data.studentId });
      return { ok: false, code: "PARSE" };
    }
    const { data: anyTutor, error: anyTutErr } = await admin
      .from("tutor_student_rel")
      .select("tutor_id")
      .eq("student_id", data.studentId)
      .limit(1);
    if (anyTutErr) {
      logSupabaseClientError(`${S}:tutorRelAny`, anyTutErr, { studentId: data.studentId });
      return { ok: false, code: "SEND" };
    }
    if ((anyTutor ?? []).length > 0) {
      logServerActionInvariantViolation(S, "self_contact_but_tutor_exists", {
        studentId: data.studentId,
      });
      return { ok: false, code: "NOT_FOUND" };
    }
    const { data: stProfile, error: stProfErr } = await admin
      .from("profiles")
      .select("is_minor")
      .eq("id", data.studentId)
      .maybeSingle();
    if (stProfErr) {
      logSupabaseClientError(`${S}:studentProfile`, stProfErr, { studentId: data.studentId });
      return { ok: false, code: "SEND" };
    }
    if (!stProfile || Boolean((stProfile as { is_minor: boolean | null }).is_minor)) {
      logServerActionInvariantViolation(S, "self_contact_not_adult", { studentId: data.studentId });
      return { ok: false, code: "NOT_FOUND" };
    }
  } else {
    const { data: link, error: linkErr } = await admin
      .from("tutor_student_rel")
      .select("tutor_id")
      .eq("student_id", data.studentId)
      .eq("tutor_id", data.mailUserId)
      .maybeSingle();

    if (linkErr) {
      logSupabaseClientError(`${S}:tutorLink`, linkErr, { studentId: data.studentId });
      return { ok: false, code: "SEND" };
    }
    if (!link) {
      logServerActionInvariantViolation(S, "tutor_not_linked", {
        studentId: data.studentId,
        mailUserId: data.mailUserId,
      });
      return { ok: false, code: "NO_LINK" };
    }
  }

  const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(data.mailUserId);
  if (authErr) {
    logSupabaseClientError(`${S}:authUser`, authErr, { mailUserId: data.mailUserId });
    return { ok: false, code: "SEND" };
  }
  const to = authUser.user?.email?.trim();
  if (!to) {
    logServerActionInvariantViolation(S, "auth_user_no_email", { mailUserId: data.mailUserId });
    return { ok: false, code: "NO_EMAIL" };
  }

  return { ok: true, to };
}
