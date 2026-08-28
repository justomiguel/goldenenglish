import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";
import { registrationIsActionable } from "@/lib/register/registrationIsActionable";
import type { RegistrationIntakeState } from "@/lib/register/registrationIntake";

const BLOCKED_INTAKE: ReadonlySet<RegistrationIntakeState> = new Set([
  "awaiting_fee",
  "receipt_pending",
  "needs_section",
  "section_full",
]);

export function canStartRegistrationEnrollmentFeeFlow(row: {
  status: string;
  preferred_section_id: string | null;
  additionalSectionIds?: string[] | null;
  requestedSectionFull?: boolean;
  feeCaptured?: boolean;
  intakeState?: RegistrationIntakeState;
}): boolean {
  if (!registrationIsActionable(row.status)) return false;
  if (row.requestedSectionFull) return false;
  if (row.feeCaptured) return false;
  if (requestedRegistrationSectionIds(row).length === 0) return false;
  const intake = row.intakeState ?? "none";
  return !BLOCKED_INTAKE.has(intake);
}
