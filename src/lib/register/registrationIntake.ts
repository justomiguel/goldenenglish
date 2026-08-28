export type RegistrationIntakeState =
  | "none"
  | "awaiting_fee"
  | "receipt_pending"
  | "needs_section"
  | "section_full";

export const REGISTRATION_INTAKE_STATES: readonly RegistrationIntakeState[] = [
  "none",
  "awaiting_fee",
  "receipt_pending",
  "needs_section",
  "section_full",
];

const STAFF_URGENT: readonly RegistrationIntakeState[] = [
  "none",
  "receipt_pending",
  "needs_section",
  "section_full",
];

export function intakeStateForSnapshotTotal(total: number): "none" | "awaiting_fee" {
  return total > 0 ? "awaiting_fee" : "none";
}

export function isRegistrationStaffUrgent(input: {
  status: string;
  intakeState: RegistrationIntakeState;
  snapshotTotal: number;
}): boolean {
  if (input.status === "enrolled") return false;
  if (input.intakeState === "none" && input.snapshotTotal > 0) return false;
  return (STAFF_URGENT as readonly string[]).includes(input.intakeState);
}

export function isRegistrationAwaitingFee(input: {
  status: string;
  intakeState: RegistrationIntakeState;
  snapshotTotal: number;
}): boolean {
  if (input.status === "enrolled") return false;
  if (input.intakeState === "awaiting_fee") return true;
  return input.intakeState === "none" && input.snapshotTotal > 0;
}

export function parseRegistrationIntakeState(raw: unknown): RegistrationIntakeState {
  const value = String(raw ?? "none");
  return (REGISTRATION_INTAKE_STATES as readonly string[]).includes(value)
    ? (value as RegistrationIntakeState)
    : "none";
}

export function snapshotTotalFromUnknown(raw: unknown): number {
  if (!raw || typeof raw !== "object") return 0;
  const total = (raw as { total?: unknown }).total;
  const n = typeof total === "number" ? total : Number(total);
  return Number.isFinite(n) ? n : 0;
}

export function snapshotCurrencyFromUnknown(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "CLP";
  const currency = (raw as { currency?: unknown }).currency;
  return typeof currency === "string" && currency.trim() ? currency.trim() : "CLP";
}
