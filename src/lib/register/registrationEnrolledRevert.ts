import {
  registrationHasMatricula,
  type RegistrationFunnelRow,
  type RegistrationFunnelStage,
} from "@/lib/register/registrationFunnelStage";

export type RegistrationEnrolledRevertResult =
  | { ok: true; nextStage: RegistrationFunnelStage; clearPayment: boolean }
  | { ok: false; code: "enrolled_revert_failed" };

export function registrationEnrolledRevert(
  row: RegistrationFunnelRow,
): RegistrationEnrolledRevertResult {
  if (row.status !== "enrolled") return { ok: false, code: "enrolled_revert_failed" };
  const clearPayment = registrationHasMatricula(row);
  if (!clearPayment) return { ok: true, nextStage: "awaiting_section", clearPayment: false };
  const mailSent =
    Boolean(row.enrollmentFeeMailSentAt) || row.intakeState === "receipt_pending";
  return {
    ok: true,
    nextStage: mailSent ? "awaiting_payment" : "contacted",
    clearPayment: true,
  };
}
