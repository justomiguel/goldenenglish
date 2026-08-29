export type TrialFeePayGate =
  | { ok: true }
  | { ok: false; code: "not_found" | "enrolled" | "already_captured" | "no_amount" | "section_full" };

export function planTrialFeePayGate(input: {
  intent: string;
  status: string;
  trialFeeCaptured: boolean;
  snapshotKind?: string;
  snapshotTotal: number;
  seatsHaveCupo: boolean;
}): TrialFeePayGate {
  if (input.intent !== "trial") return { ok: false, code: "not_found" };
  if (input.status === "enrolled") return { ok: false, code: "enrolled" };
  const pendingDelta =
    input.snapshotKind === "trial_fee_delta" && input.snapshotTotal > 0;
  if (input.trialFeeCaptured && !pendingDelta) {
    return { ok: false, code: "already_captured" };
  }
  if (!(input.snapshotTotal > 0)) return { ok: false, code: "no_amount" };
  if (!input.seatsHaveCupo) return { ok: false, code: "section_full" };
  return { ok: true };
}
