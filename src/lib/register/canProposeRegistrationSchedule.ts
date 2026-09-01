import { registrationIsActionable } from "@/lib/register/registrationIsActionable";
import type { RegistrationIntakeState } from "@/lib/register/registrationIntake";

export function canProposeRegistrationSchedule(row: {
  status: string;
  intakeState?: RegistrationIntakeState;
  requestedSectionFull?: boolean;
  preferredSectionId?: string | null;
  openAlternativeCount: number;
}): boolean {
  if (!registrationIsActionable(row.status)) return false;
  if (row.openAlternativeCount < 1) return false;
  return (
    row.intakeState === "section_full" ||
    row.intakeState === "offer_pending" ||
    row.requestedSectionFull === true
  );
}
