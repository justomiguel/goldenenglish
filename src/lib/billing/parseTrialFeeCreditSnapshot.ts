export type TrialFeeCreditSnapshot = {
  trialPaid: number;
  alreadyCredited: number;
};

export function parseTrialFeeCreditSnapshot(
  snapshot: unknown,
  captured: boolean,
): TrialFeeCreditSnapshot {
  const snap = (snapshot ?? {}) as { paidTotal?: unknown; creditedTowardEnroll?: unknown };
  const paidTotal = Math.max(0, Number(snap.paidTotal ?? 0) || 0);
  const alreadyCredited = Math.max(0, Number(snap.creditedTowardEnroll ?? 0) || 0);
  return {
    trialPaid: captured ? paidTotal : 0,
    alreadyCredited,
  };
}

export function withTrialCreditRecorded(
  snapshot: unknown,
  applied: number,
): Record<string, unknown> {
  const snap = { ...((snapshot ?? {}) as Record<string, unknown>) };
  const prev = Math.max(0, Number(snap.creditedTowardEnroll ?? 0) || 0);
  snap.creditedTowardEnroll = prev + Math.max(0, Number(applied) || 0);
  return snap;
}
