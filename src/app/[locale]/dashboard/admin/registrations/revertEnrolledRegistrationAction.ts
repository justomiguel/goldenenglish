"use server";

import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { collectSectionsChargingEnrollmentFee } from "@/lib/register/markRegistrationRowsEnrollmentFee";
import { registrationEnrolledRevert } from "@/lib/register/registrationEnrolledRevert";
import {
  parseRegistrationIntakeState,
  snapshotTotalFromUnknown,
} from "@/lib/register/registrationIntake";
import { revalidateRegistrationInbox } from "@/lib/register/registrationIntakeActionSupport";
import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";
import { createAdminClient } from "@/lib/supabase/admin";

const idZ = z.string().uuid();

function cohortOf(value: unknown): string {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return "";
  const cohortId = (row as { cohort_id?: unknown }).cohort_id;
  return typeof cohortId === "string" ? cohortId : "";
}

export async function revertEnrolledRegistrationAction(input: {
  locale: string;
  registrationId: string;
  cohortId: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("revertEnrolledRegistration");
    return { ok: false, code: "forbidden" };
  }

  const registrationId = idZ.safeParse(input.registrationId);
  const cohortId = idZ.safeParse(input.cohortId);
  if (!registrationId.success || !cohortId.success) return { ok: false, code: "not_found" };

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("registrations")
    .select(
      "id,status,intake_state,fee_snapshot,fee_captured,enrollment_fee_mail_sent_at,accepted_student_id,preferred_section_id,additional_section_ids",
    )
    .eq("id", registrationId.data)
    .maybeSingle();
  if (error || !data) {
    if (error) {
      logSupabaseClientError("revertEnrolledRegistration", error, { registrationId: registrationId.data });
    }
    return { ok: false, code: "not_found" };
  }

  const row = data as Record<string, unknown>;
  const additional = Array.isArray(row.additional_section_ids) ? row.additional_section_ids.map(String) : [];
  const preferred = row.preferred_section_id == null ? null : String(row.preferred_section_id);
  const requested = requestedRegistrationSectionIds({
    preferred_section_id: preferred,
    additionalSectionIds: additional,
  });
  const charging = await collectSectionsChargingEnrollmentFee(admin, requested);
  const step = registrationEnrolledRevert({
    status: String(row.status ?? ""),
    intakeState: parseRegistrationIntakeState(row.intake_state),
    snapshotTotal: snapshotTotalFromUnknown(row.fee_snapshot),
    chargesEnrollmentFee: requested.some((id) => charging.has(id)),
    feeCaptured: row.fee_captured === true,
    enrollmentFeeMailSentAt:
      row.enrollment_fee_mail_sent_at == null ? null : String(row.enrollment_fee_mail_sent_at),
    acceptedStudentId: row.accepted_student_id == null ? null : String(row.accepted_student_id),
  });
  if (!step.ok) return { ok: false, code: step.code };

  const studentId = typeof row.accepted_student_id === "string" ? row.accepted_student_id : "";
  if (studentId) {
    const active = await admin
      .from("section_enrollments")
      .select("id,academic_sections(cohort_id)")
      .eq("student_id", studentId)
      .eq("status", "active");
    if (active.error) {
      logSupabaseClientError("revertEnrolledRegistration", active.error, { studentId });
      return { ok: false, code: "save_failed" };
    }
    const ids = ((active.data ?? []) as { id?: unknown; academic_sections?: unknown }[])
      .filter((item) => cohortOf(item.academic_sections) === cohortId.data)
      .map((item) => String(item.id ?? ""))
      .filter(Boolean);
    if (ids.length > 0) {
      const dropped = await admin.from("section_enrollments").update({ status: "dropped" }).in("id", ids);
      if (dropped.error) {
        logSupabaseClientError("revertEnrolledRegistration", dropped.error, { registrationId: registrationId.data });
        return { ok: false, code: "save_failed" };
      }
    }
  }

  const patch: Record<string, unknown> = { status: "contacted" };
  if (step.clearPayment) {
    patch.fee_captured = false;
    patch.enrollment_fee_paid_method = null;
    patch.enrollment_fee_paid_amount = null;
    patch.enrollment_fee_paid_on = null;
  }
  const saved = await admin.from("registrations").update(patch).eq("id", registrationId.data);
  if (saved.error) {
    logSupabaseClientError("revertEnrolledRegistration", saved.error, { registrationId: registrationId.data });
    return { ok: false, code: "save_failed" };
  }

  await recordSystemAudit({
    action: "registration_funnel_revert",
    resourceType: "registration",
    resourceId: registrationId.data,
    payload: { from_stage: "enrolled_in_section", to_stage: step.nextStage },
  });
  revalidateRegistrationInbox(input.locale);
  return { ok: true };
}
