export type RegistrationPayPageKind =
  | "enrolled"
  | "needs_section"
  | "section_full"
  | "captured_full"
  | "receipt_pending"
  | "captured"
  | "no_fee"
  | "pay";

export function registrationPayPageKind(input: {
  status: string;
  intakeState: string;
  feeCaptured: boolean;
  snapshotTotal: number;
  sectionIsFull: boolean;
}): RegistrationPayPageKind {
  if (input.status === "enrolled") return "enrolled";
  if (input.intakeState === "needs_section") return "needs_section";
  if (input.sectionIsFull && input.feeCaptured) return "captured_full";
  if (input.sectionIsFull) return "section_full";
  if (input.intakeState === "receipt_pending") return "receipt_pending";
  if (input.feeCaptured) return "captured";
  if (!(input.snapshotTotal > 0)) return "no_fee";
  return "pay";
}
