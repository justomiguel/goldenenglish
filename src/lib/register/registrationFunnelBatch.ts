export type FunnelBatchItem = {
  applied: boolean;
  leftStage: boolean;
};

export type FunnelBatchSummary = {
  ok: boolean;
  code?: "funnel_batch_empty" | "funnel_batch_partial" | "save_failed";
  updated: number;
  failed: number;
};

export function summarizeRegistrationFunnelBatch(items: readonly FunnelBatchItem[]): FunnelBatchSummary {
  if (items.length === 0) {
    return { ok: false, code: "funnel_batch_empty", updated: 0, failed: 0 };
  }
  const updated = items.filter((item) => item.applied).length;
  const failed = items.length - updated;
  const stillInStage = items.some((item) => !item.leftStage);
  if (!stillInStage) {
    return { ok: false, code: "funnel_batch_empty", updated: 0, failed };
  }
  if (updated === items.length) return { ok: true, updated, failed: 0 };
  if (updated === 0) return { ok: false, code: "save_failed", updated: 0, failed };
  return { ok: false, code: "funnel_batch_partial", updated, failed };
}

export function registrationFunnelBatchMessage(
  result: { code?: string; updated?: number; failed?: number },
  sentences: Record<string, string | undefined>,
  unknownTemplate: string,
): string {
  const code = result.code ?? "save_failed";
  const known = sentences[code];
  const template = known ?? unknownTemplate;
  return template
    .replaceAll("{{updated}}", String(result.updated ?? 0))
    .replaceAll("{{failed}}", String(result.failed ?? 0))
    .replaceAll("{{code}}", code);
}
