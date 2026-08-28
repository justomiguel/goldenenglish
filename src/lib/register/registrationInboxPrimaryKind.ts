import { registrationIsActionable } from "@/lib/register/registrationIsActionable";
import {
  isRegistrationAwaitingFee,
  type RegistrationIntakeState,
} from "@/lib/register/registrationIntake";

export type RegistrationInboxPrimaryKind = "accept" | "waive" | "receipt" | "assign";

export function registrationInboxPrimaryKind(row: {
  status: string;
  intakeState?: RegistrationIntakeState;
  snapshotTotal?: number;
}): RegistrationInboxPrimaryKind | null {
  if (!registrationIsActionable(row.status)) return null;
  const intakeState = row.intakeState ?? "none";
  const snapshotTotal = row.snapshotTotal ?? 0;
  if (isRegistrationAwaitingFee({ status: row.status, intakeState, snapshotTotal })) {
    return "waive";
  }
  if (intakeState === "receipt_pending") return "receipt";
  if (intakeState === "needs_section" || intakeState === "section_full") return "assign";
  return "accept";
}
