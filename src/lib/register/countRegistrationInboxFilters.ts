import { registrationFunnelStage, type RegistrationFunnelStage } from "@/lib/register/registrationFunnelStage";
import { registrationFeeFamilyClaim } from "@/lib/register/registrationFeeFamilyClaim";
import {
  parseRegistrationIntakeState,
  snapshotCurrencyFromUnknown,
  snapshotTotalFromUnknown,
  type RegistrationIntakeState,
} from "@/lib/register/registrationIntake";

export type RegistrationInboxCounts = Record<RegistrationFunnelStage, number>;

export function emptyRegistrationInboxCounts(): RegistrationInboxCounts {
  return {
    registered: 0,
    contacted: 0,
    awaiting_payment: 0,
    paid_without_section: 0,
    awaiting_section: 0,
    enrolled_in_section: 0,
  };
}

export function countRegistrationInboxFilters(
  rows: Array<{
    status: string;
    intake_state?: unknown;
    fee_snapshot?: unknown;
    fee_captured?: unknown;
    enrollment_fee_mail_sent_at?: unknown;
    accepted_student_id?: unknown;
    chargesEnrollmentFee?: boolean;
  }>,
): RegistrationInboxCounts {
  const counts = emptyRegistrationInboxCounts();
  for (const row of rows) {
    if (row.status === "enrolled") {
      counts.enrolled_in_section += 1;
      continue;
    }
    const stage = registrationFunnelStage({
      status: row.status,
      intakeState: parseRegistrationIntakeState(row.intake_state),
      snapshotTotal: snapshotTotalFromUnknown(row.fee_snapshot),
      chargesEnrollmentFee: row.chargesEnrollmentFee,
      feeCaptured: row.fee_captured === true,
      enrollmentFeeMailSentAt:
        typeof row.enrollment_fee_mail_sent_at === "string" ? row.enrollment_fee_mail_sent_at : null,
      acceptedStudentId:
        row.accepted_student_id != null ? String(row.accepted_student_id) : null,
    });
    if (stage) counts[stage] += 1;
  }
  return counts;
}

export function mapInboxLeadFields(row: {
  intake_state?: unknown;
  fee_snapshot?: unknown;
  fee_captured?: unknown;
  enrollment_fee_receipt_path?: unknown;
  enrollment_fee_mail_sent_at?: unknown;
}): {
  intakeState: RegistrationIntakeState;
  snapshotTotal: number;
  snapshotCurrency: string;
  feeSnapshot: unknown;
  feeCaptured: boolean;
  enrollmentFeeReceiptPath: string | null;
  enrollmentFeeMailSentAt: string | null;
  enrollmentFeeFamilyClaim: "cash" | null;
} {
  return {
    intakeState: parseRegistrationIntakeState(row.intake_state),
    snapshotTotal: snapshotTotalFromUnknown(row.fee_snapshot),
    snapshotCurrency: snapshotCurrencyFromUnknown(row.fee_snapshot),
    feeSnapshot: row.fee_snapshot ?? {},
    feeCaptured: row.fee_captured === true,
    enrollmentFeeReceiptPath:
      typeof row.enrollment_fee_receipt_path === "string" && row.enrollment_fee_receipt_path.trim()
        ? row.enrollment_fee_receipt_path
        : null,
    enrollmentFeeMailSentAt:
      typeof row.enrollment_fee_mail_sent_at === "string" && row.enrollment_fee_mail_sent_at.trim()
        ? row.enrollment_fee_mail_sent_at
        : null,
    enrollmentFeeFamilyClaim: registrationFeeFamilyClaim(row.fee_snapshot),
  };
}
