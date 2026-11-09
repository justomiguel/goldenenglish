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

export type MercadoPagoWebhookSignatureCode =
  | "missing_secret"
  | "missing_signature"
  | "missing_data_id"
  | "malformed_signature"
  | "timestamp_out_of_window"
  | "digest_mismatch";

export type MercadoPagoWebhookSignatureResult =
  | { ok: true }
  | { ok: false; code: MercadoPagoWebhookSignatureCode };

/**
 * Validates MercadoPago webhook `x-signature` (HMAC-SHA256).
 * Manifest: id:{dataId};request-id:{xRequestId};ts:{ts};
 */
export function mercadoPagoVerifyWebhookSignature(
  input: MercadoPagoWebhookSignatureInput,
): MercadoPagoWebhookSignatureResult {
  const secret = input.webhookSecret.trim();
  if (!secret) return { ok: false, code: "missing_secret" };
  const header = input.xSignature?.trim() ?? "";
  if (!header) return { ok: false, code: "missing_signature" };
  if (!input.dataId.trim()) return { ok: false, code: "missing_data_id" };

  let ts = "";
  let v1 = "";
  for (const part of header.split(",")) {
    const [k, v] = part.split("=", 2);
    if (k?.trim() === "ts") ts = v?.trim() ?? "";
    if (k?.trim() === "v1") v1 = v?.trim() ?? "";
  }
  if (!ts || !v1) return { ok: false, code: "malformed_signature" };

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return { ok: false, code: "malformed_signature" };
  const now = input.nowMs ?? Date.now();
  if (Math.abs(now - tsNum * 1000) > MAX_TIMESTAMP_DRIFT_MS) {
    return { ok: false, code: "timestamp_out_of_window" };
  }

  const requestId = input.xRequestId?.trim() ?? "";
  const manifest = `id:${input.dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(v1, "utf8");
    if (a.length === b.length && timingSafeEqual(a, b)) return { ok: true };
  } catch {
    return { ok: false, code: "digest_mismatch" };
  }
  return { ok: false, code: "digest_mismatch" };
}
