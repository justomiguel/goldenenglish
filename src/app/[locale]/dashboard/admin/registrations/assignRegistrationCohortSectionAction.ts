"use server";

import { enrollStudentInSectionAction } from "@/app/[locale]/dashboard/admin/academic/enrollmentActions";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  sectionAssignedRegistrationWrite,
  sectionMatchesRegisteredCohort,
} from "@/lib/register/registrationMatriculaAlta";
import {
  requireRegistrationIntakeAdmin,
  revalidateRegistrationInbox,
} from "@/lib/register/registrationIntakeActionSupport";
import { parseJoinDispositionInput, type JoinBillingDisposition } from "@/lib/billing/joinBillingDispositionSchema";
import { createAdminClient } from "@/lib/supabase/admin";

export async function assignRegistrationCohortSectionAction(input: {
  locale: string;
  registrationId: string;
  sectionId: string;
  joinDisposition?: JoinBillingDisposition;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const auth = await requireRegistrationIntakeAdmin();
  if (!auth.ok) return auth;
  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("registrations")
    .select(
      "id, status, accepted_student_id, preferred_section_id, enrollment_fee_paid_method, enrollment_fee_paid_amount, enrollment_fee_paid_on",
    )
    .eq("id", input.registrationId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("assignRegistrationCohortSection:select", error, {
      registrationId: input.registrationId,
    });
    return { ok: false, code: "save_failed" };
  }
  if (!data) return { ok: false, code: "not_found" };
  const row = data as {
    status?: string | null;
    accepted_student_id?: string | null;
    preferred_section_id?: string | null;
    enrollment_fee_paid_method?: string | null;
    enrollment_fee_paid_amount?: number | null;
    enrollment_fee_paid_on?: string | null;
  };
  const studentId = row.accepted_student_id ? String(row.accepted_student_id) : "";
  if (!studentId) return { ok: false, code: "not_approved" };
  if (String(row.status ?? "") === "enrolled") return { ok: false, code: "already_enrolled" };
  const preferredId = row.preferred_section_id ? String(row.preferred_section_id) : "";
  if (!preferredId) return { ok: false, code: "no_cohort" };

  const cohort = await cohortIds(admin, [preferredId, input.sectionId]);
  if (!cohort.ok) return cohort;
  const registeredCohortId = cohort.ids.get(preferredId) ?? null;
  const sectionCohortId = cohort.ids.get(input.sectionId) ?? null;
  if (!registeredCohortId) return { ok: false, code: "no_cohort" };
  if (!sectionMatchesRegisteredCohort(sectionCohortId, registeredCohortId)) {
    return { ok: false, code: "section_cohort_mismatch" };
  }

  const disposition = input.joinDisposition
    ? parseJoinDispositionInput(input.joinDisposition)
    : { kind: "behind" as const };
  if (!disposition) return { ok: false, code: "validation" };
  const enrolled = await enrollStudentInSectionAction({
    locale: input.locale,
    studentId,
    sectionId: input.sectionId,
    joinDisposition: disposition,
  });
  if (!enrolled.ok && enrolled.code !== "ALREADY_ACTIVE") return enrolled;

  const { error: writeErr } = await admin
    .from("registrations")
    .update(sectionAssignedRegistrationWrite())
    .eq("id", input.registrationId);
  if (writeErr) {
    logSupabaseClientError("assignRegistrationCohortSection:write", writeErr, {
      registrationId: input.registrationId,
    });
    return { ok: false, code: "save_failed" };
  }

  if (row.enrollment_fee_paid_method) {
    await admin
      .from("section_enrollments")
      .update({
        last_enrollment_paid_at: new Date().toISOString(),
        enrollment_fee_paid_method: row.enrollment_fee_paid_method,
        enrollment_fee_paid_amount: row.enrollment_fee_paid_amount,
        enrollment_fee_paid_on: row.enrollment_fee_paid_on,
      })
      .eq("student_id", studentId)
      .eq("section_id", input.sectionId)
      .eq("status", "active");
  }

  revalidateRegistrationInbox(input.locale);
  return { ok: true };
}

async function cohortIds(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  sectionIds: string[],
): Promise<{ ok: true; ids: Map<string, string> } | { ok: false; code: string }> {
  const { data, error } = await admin
    .from("academic_sections")
    .select("id, cohort_id")
    .in("id", sectionIds);
  if (error) {
    logSupabaseClientError("assignRegistrationCohortSection:cohort", error, {});
    return { ok: false, code: "save_failed" };
  }
  const ids = new Map<string, string>();
  for (const row of data ?? []) {
    const typed = row as { id?: unknown; cohort_id?: unknown };
    if (typeof typed.id === "string" && typeof typed.cohort_id === "string") {
      ids.set(typed.id, typed.cohort_id);
    }
  }
  return { ok: true, ids };
}
