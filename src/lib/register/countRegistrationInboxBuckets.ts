import {
  isRegistrationAwaitingFee,
  isRegistrationStaffUrgent,
  type RegistrationIntakeState,
} from "@/lib/register/registrationIntake";

export function countRegistrationInboxBuckets(
  rows: Array<{
    status: string;
    intakeState: RegistrationIntakeState;
    snapshotTotal: number;
  }>,
): { urgentCount: number; awaitingFeeCount: number } {
  let urgentCount = 0;
  let awaitingFeeCount = 0;
  for (const row of rows) {
    if (isRegistrationStaffUrgent(row)) urgentCount += 1;
    if (isRegistrationAwaitingFee(row)) awaitingFeeCount += 1;
  }
  return { urgentCount, awaitingFeeCount };
}
