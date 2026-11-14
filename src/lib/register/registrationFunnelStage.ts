import type { RegistrationIntakeState } from "@/lib/register/registrationIntake";

export const REGISTRATION_FUNNEL_STAGES = [
  "registered",
  "contacted",
  "awaiting_payment",
  "paid_without_section",
  "awaiting_section",
  "enrolled_in_section",
] as const;

export type RegistrationFunnelStage = (typeof REGISTRATION_FUNNEL_STAGES)[number];

export type RegistrationFunnelRow = {
  status: string;
  intakeState?: RegistrationIntakeState;
  snapshotTotal?: number;
  chargesEnrollmentFee?: boolean;
  feeCaptured?: boolean;
  enrollmentFeeMailSentAt?: string | null;
  acceptedStudentId?: string | null;
};

export function registrationHasMatricula(row: {
  chargesEnrollmentFee?: boolean;
  snapshotTotal?: number;
}): boolean {
  return row.chargesEnrollmentFee === true || (row.snapshotTotal ?? 0) > 0;
}

const FEE_FUNNEL_STAGES = [
  "registered",
  "contacted",
  "awaiting_payment",
  "paid_without_section",
  "enrolled_in_section",
] as const satisfies readonly RegistrationFunnelStage[];

const NO_FEE_FUNNEL_STAGES = [
  "registered",
  "awaiting_section",
  "enrolled_in_section",
] as const satisfies readonly RegistrationFunnelStage[];

export function registrationFunnelStagesForCohort(
  hasMatricula: boolean,
): readonly RegistrationFunnelStage[] {
  return hasMatricula ? FEE_FUNNEL_STAGES : NO_FEE_FUNNEL_STAGES;
}

export function visibleRegistrationInboxFilter(
  inbox: RegistrationFunnelStage,
  hasMatricula: boolean,
): RegistrationFunnelStage {
  const stages = registrationFunnelStagesForCohort(hasMatricula);
  return stages.includes(inbox) ? inbox : "registered";
}

export function registrationFunnelStage(row: RegistrationFunnelRow): RegistrationFunnelStage | null {
  if (row.status === "enrolled") return null;
  const hasFee = registrationHasMatricula(row);
  const paid = row.feeCaptured === true;
  const mailSent =
    Boolean(row.enrollmentFeeMailSentAt) || row.intakeState === "receipt_pending";

  if (hasFee && paid) return "paid_without_section";
  if (!hasFee && row.status === "contacted") return "awaiting_section";
  if (hasFee && mailSent && !paid) return "awaiting_payment";
  if (row.status === "contacted" && hasFee) return "contacted";
  return "registered";
}
