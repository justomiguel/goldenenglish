/**
 * Flow `/payment/create` HTTP 400 payloads often embed JSON after `flow_http_400:`.
 */

const FLOW_AMOUNT_BELOW_MIN_CODE = 1901;

/** Extract minimum CLP from Flow error JSON (e.g. code 1901) when present. */
export function extractFlowMinimumClpFromCreateError(flowError: string): number | null {
  const idx = flowError.indexOf("flow_http_");
  if (idx < 0) return null;
  const colon = flowError.indexOf(":", idx);
  if (colon < 0) return null;
  const payload = flowError.slice(colon + 1).trim();
  try {
    const j = JSON.parse(payload) as { code?: unknown; message?: unknown };
    if (j.code !== FLOW_AMOUNT_BELOW_MIN_CODE || typeof j.message !== "string") return null;
    const m = j.message.match(/(\d[\d\s.,]*)\s*CLP/i);
    if (!m?.[1]) return null;
    const digits = m[1].replace(/[\s.,]/g, "");
    const n = Number.parseInt(digits, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function isFlowAmountBelowMinimumError(flowError: string): boolean {
  return extractFlowMinimumClpFromCreateError(flowError) != null;
}
