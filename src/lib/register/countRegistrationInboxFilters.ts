import {
  isRegistrationAwaitingFee,
  isRegistrationStaffUrgent,
  parseRegistrationIntakeState,
  snapshotCurrencyFromUnknown,
  snapshotTotalFromUnknown,
  type RegistrationIntakeState,
} from "@/lib/register/registrationIntake";

export type RegistrationInboxCounts = {
  urgent: number;
  awaiting_fee: number;
  receipt_pending: number;
  needs_section: number;
  section_full: number;
  contacted: number;
};

export function emptyRegistrationInboxCounts(): RegistrationInboxCounts {
  return {
    urgent: 0,
    awaiting_fee: 0,
    receipt_pending: 0,
    needs_section: 0,
    section_full: 0,
    contacted: 0,
  };
}

export function countRegistrationInboxFilters(
  rows: Array<{
    status: string;
    intake_state?: unknown;
    fee_snapshot?: unknown;
  }>,
): RegistrationInboxCounts {
  const counts = emptyRegistrationInboxCounts();
  for (const row of rows) {
    const intakeState = parseRegistrationIntakeState(row.intake_state);
    const snapshotTotal = snapshotTotalFromUnknown(row.fee_snapshot);
    const input = { status: row.status, intakeState, snapshotTotal };
    if (isRegistrationStaffUrgent(input)) counts.urgent += 1;
    if (isRegistrationAwaitingFee(input)) counts.awaiting_fee += 1;
    if (intakeState === "receipt_pending") counts.receipt_pending += 1;
    if (intakeState === "needs_section") counts.needs_section += 1;
    if (intakeState === "section_full") counts.section_full += 1;
    if (row.status === "contacted") counts.contacted += 1;
  }
  return counts;
}

export function mapInboxLeadFields(row: {
  intake_state?: unknown;
  fee_snapshot?: unknown;
  fee_captured?: unknown;
  enrollment_fee_receipt_path?: unknown;
}): {
  intakeState: RegistrationIntakeState;
  snapshotTotal: number;
  snapshotCurrency: string;
  feeCaptured: boolean;
  enrollmentFeeReceiptPath: string | null;
} {
  return {
    intakeState: parseRegistrationIntakeState(row.intake_state),
    snapshotTotal: snapshotTotalFromUnknown(row.fee_snapshot),
    snapshotCurrency: snapshotCurrencyFromUnknown(row.fee_snapshot),
    feeCaptured: row.fee_captured === true,
    enrollmentFeeReceiptPath:
      typeof row.enrollment_fee_receipt_path === "string" && row.enrollment_fee_receipt_path.trim()
        ? row.enrollment_fee_receipt_path
        : null,
  };
}
