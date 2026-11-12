import {
  registrationFunnelStage,
  type RegistrationFunnelRow,
  type RegistrationFunnelStage,
} from "@/lib/register/registrationFunnelStage";

export type FunnelRevertPatch = {
  status?: "new" | "contacted";
  contacted_at?: null;
  contacted_by?: null;
  enrollment_fee_mail_sent_at?: null;
  intake_state?: "none";
  fee_captured?: false;
  enrollment_fee_paid_method?: null;
  enrollment_fee_paid_amount?: null;
  enrollment_fee_paid_on?: null;
};

export type FunnelRevertResult =
  | { ok: true; nextStage: RegistrationFunnelStage; patch: FunnelRevertPatch }
  | { ok: false; code: "funnel_revert_not_allowed" };

function mailSent(row: RegistrationFunnelRow): boolean {
  return Boolean(row.enrollmentFeeMailSentAt) || row.intakeState === "receipt_pending";
}

function afterPatch(row: RegistrationFunnelRow, patch: FunnelRevertPatch): RegistrationFunnelRow {
  return {
    ...row,
    status: patch.status ?? row.status,
    intakeState: patch.intake_state ?? row.intakeState,
    feeCaptured: patch.fee_captured === false ? false : row.feeCaptured,
    enrollmentFeeMailSentAt:
      patch.enrollment_fee_mail_sent_at === null ? null : row.enrollmentFeeMailSentAt,
  };
}

export function registrationFunnelRevert(row: RegistrationFunnelRow): FunnelRevertResult {
  const stage = registrationFunnelStage(row);
  if (stage === null || stage === "registered") {
    return { ok: false, code: "funnel_revert_not_allowed" };
  }

  let patch: FunnelRevertPatch;
  if (stage === "contacted" || stage === "awaiting_section") {
    patch = { status: "new", contacted_at: null, contacted_by: null };
  } else if (stage === "awaiting_payment") {
    patch = {
      status: "contacted",
      enrollment_fee_mail_sent_at: null,
      ...(row.intakeState === "receipt_pending" ? { intake_state: "none" as const } : {}),
    };
  } else {
    patch = {
      fee_captured: false,
      enrollment_fee_paid_method: null,
      enrollment_fee_paid_amount: null,
      enrollment_fee_paid_on: null,
      ...(mailSent(row) ? {} : { status: "contacted" as const }),
    };
  }

  const nextStage = registrationFunnelStage(afterPatch(row, patch));
  if (!nextStage) return { ok: false, code: "funnel_revert_not_allowed" };
  return { ok: true, nextStage, patch };
}
