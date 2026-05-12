import type { FlowStatusPayload, FlowFetchStatusResult } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";

/**
 * Normalizes Flow `/payment/getStatus` JSON.
 *
 * Flow has been observed in the wild to return `amount`, `flowOrder` and `status` either as
 * numbers or as numeric strings (`"350"`); we accept both. When the body shape doesn't match a
 * Flow status payload at all (e.g. `{ code, message }` error envelopes, missing keys), the
 * returned `error` string is rich enough to log so a tenant can audit credentials/env quickly,
 * without leaking the raw payload (which can include payer info).
 */
export function parseFlowStatusResponseBody(json: unknown): FlowFetchStatusResult {
  if (json == null || typeof json !== "object") {
    return { ok: false, error: "flow_invalid_status_response:not_object" };
  }
  const o = json as Record<string, unknown>;

  if (
    !("flowOrder" in o) &&
    typeof o.code === "number" &&
    typeof o.message === "string"
  ) {
    return { ok: false, error: `flow_status_error_code_${o.code}` };
  }

  const flowOrder = coerceInt(o.flowOrder);
  const status = coerceInt(o.status);
  const amount = coerceInt(o.amount);
  const commerceOrder = typeof o.commerceOrder === "string" ? o.commerceOrder : null;
  const currency = typeof o.currency === "string" ? o.currency : null;

  if (flowOrder == null || status == null || amount == null || commerceOrder == null || currency == null) {
    const missing: string[] = [];
    if (flowOrder == null) missing.push("flowOrder");
    if (status == null) missing.push("status");
    if (amount == null) missing.push("amount");
    if (commerceOrder == null) missing.push("commerceOrder");
    if (currency == null) missing.push("currency");
    return { ok: false, error: `flow_invalid_status_response:missing=${missing.join(",")}` };
  }

  const paymentData = extractPaymentData(o.paymentData);

  const payload: FlowStatusPayload = {
    flowOrder,
    commerceOrder,
    status,
    amount,
    currency,
    payer: typeof o.payer === "string" ? o.payer : undefined,
    ...(paymentData ? { paymentData } : {}),
  };
  return { ok: true, data: payload };
}

function extractPaymentData(raw: unknown): FlowStatusPayload["paymentData"] | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const date = typeof o.date === "string" && o.date.trim() ? o.date.trim() : undefined;
  const media = typeof o.media === "string" && o.media.trim() ? o.media.trim() : undefined;
  const fee = coerceNumber(o.fee);
  const balance = coerceNumber(o.balance);
  const transferDate =
    typeof o.transferDate === "string" && o.transferDate.trim() ? o.transferDate.trim() : undefined;
  const conversionRate = coerceNumber(o.conversionRate);
  const conversionDate =
    typeof o.conversionDate === "string" && o.conversionDate.trim() ? o.conversionDate.trim() : undefined;

  if (
    !date &&
    !media &&
    fee == null &&
    balance == null &&
    !transferDate &&
    conversionRate == null &&
    !conversionDate
  ) {
    return null;
  }
  return {
    ...(date ? { date } : {}),
    ...(media ? { media } : {}),
    ...(fee != null ? { fee } : {}),
    ...(balance != null ? { balance } : {}),
    ...(transferDate ? { transferDate } : {}),
    ...(conversionRate != null ? { conversionRate } : {}),
    ...(conversionDate ? { conversionDate } : {}),
  };
}

function coerceNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function coerceInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
    const n = Number.parseFloat(trimmed);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
}
