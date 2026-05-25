import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_TIMESTAMP_DRIFT_MS = 300_000;

export type MercadoPagoWebhookSignatureInput = {
  webhookSecret: string;
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  /** Overridable clock for testing (defaults to Date.now()). */
  nowMs?: number;
};

/**
 * Validates MercadoPago webhook `x-signature` (HMAC-SHA256).
 * Manifest: id:{dataId};request-id:{xRequestId};ts:{ts};
 */
export function mercadoPagoVerifyWebhookSignature(
  input: MercadoPagoWebhookSignatureInput,
): boolean {
  const secret = input.webhookSecret.trim();
  const header = input.xSignature?.trim() ?? "";
  if (!secret || !header || !input.dataId.trim()) return false;

  let ts = "";
  let v1 = "";
  for (const part of header.split(",")) {
    const [k, v] = part.split("=", 2);
    if (k?.trim() === "ts") ts = v?.trim() ?? "";
    if (k?.trim() === "v1") v1 = v?.trim() ?? "";
  }
  if (!ts || !v1) return false;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;
  const now = input.nowMs ?? Date.now();
  if (Math.abs(now - tsNum * 1000) > MAX_TIMESTAMP_DRIFT_MS) return false;

  const requestId = input.xRequestId?.trim() ?? "";
  const manifest = `id:${input.dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(v1, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
