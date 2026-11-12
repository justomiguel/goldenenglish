"use server";

import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { collectSectionsChargingEnrollmentFee } from "@/lib/register/markRegistrationRowsEnrollmentFee";
import { registrationFunnelRevert } from "@/lib/register/registrationFunnelRevert";
import { registrationFunnelStage } from "@/lib/register/registrationFunnelStage";
import {
  parseRegistrationIntakeState,
  snapshotTotalFromUnknown,
} from "@/lib/register/registrationIntake";
import { revalidateRegistrationInbox } from "@/lib/register/registrationIntakeActionSupport";
import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";
import { createAdminClient } from "@/lib/supabase/admin";

const idZ = z.string().uuid();

export async function revertRegistrationFunnelStageAction(input: {
  locale: string;
  registrationId: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  let actorId = "";
  try {
    const ctx = await assertAdmin();
    actorId = ctx.user.id;
  } catch {
    logServerAuthzDenied("revertRegistrationFunnelStage");
    return { ok: false, code: "forbidden" };
  }

  const parsed = idZ.safeParse(input.registrationId);
  if (!parsed.success) return { ok: false, code: "not_found" };

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("registrations")
    .select(
      "id,status,intake_state,fee_snapshot,fee_captured,enrollment_fee_mail_sent_at,accepted_student_id,preferred_section_id,additional_section_ids",
    )
    .eq("id", parsed.data)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("revertRegistrationFunnelStage:select", error, {
      registrationId: parsed.data,
    });
    return { ok: false, code: "not_found" };
  }
  if (!data) return { ok: false, code: "not_found" };

  const row = data as Record<string, unknown>;
  const additional = Array.isArray(row.additional_section_ids)
    ? row.additional_section_ids.map(String)
    : [];
  const preferred = row.preferred_section_id == null ? null : String(row.preferred_section_id);
  const charging = await collectSectionsChargingEnrollmentFee(
    admin,
    requestedRegistrationSectionIds({ preferred_section_id: preferred, additionalSectionIds: additional }),
  );
  const funnelRow = {
    status: String(row.status ?? ""),
    intakeState: parseRegistrationIntakeState(row.intake_state),
    snapshotTotal: snapshotTotalFromUnknown(row.fee_snapshot),
    chargesEnrollmentFee: requestedRegistrationSectionIds({
      preferred_section_id: preferred,
      additionalSectionIds: additional,
    }).some((id) => charging.has(id)),
    feeCaptured: row.fee_captured === true,
    enrollmentFeeMailSentAt:
      row.enrollment_fee_mail_sent_at == null ? null : String(row.enrollment_fee_mail_sent_at),
    acceptedStudentId: row.accepted_student_id == null ? null : String(row.accepted_student_id),
  };
  const fromStage = registrationFunnelStage(funnelRow);
  const step = registrationFunnelRevert(funnelRow);
  if (!step.ok || !fromStage) return { ok: false, code: "funnel_revert_not_allowed" };

  const patch = { ...step.patch };
  if (patch.status === "contacted") {
    Object.assign(patch, {
      contacted_at: new Date().toISOString(),
      contacted_by: actorId,
    });
  }

  const { error: updateError } = await admin
    .from("registrations")
    .update(patch)
    .eq("id", parsed.data);
  if (updateError) {
    logSupabaseClientError("revertRegistrationFunnelStage:update", updateError, {
      registrationId: parsed.data,
      code: "save_failed",
    });
    return { ok: false, code: "save_failed" };
  }

  await recordSystemAudit({
    action: "registration_funnel_revert",
    resourceType: "registration",
    resourceId: parsed.data,
    payload: { from_stage: fromStage, to_stage: step.nextStage },
  });
  revalidateRegistrationInbox(input.locale);
  return { ok: true };
}
