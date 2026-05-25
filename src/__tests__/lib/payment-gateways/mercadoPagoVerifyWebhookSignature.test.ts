/** @vitest-environment node */
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { mercadoPagoVerifyWebhookSignature } from "@/lib/payment-gateways/mercadopago/mercadoPagoVerifyWebhookSignature";

describe("mercadoPagoVerifyWebhookSignature", () => {
  const secret = "test-webhook-secret";
  const dataId = "12345";
  const requestId = "req-abc";
  const tsSeconds = 1700000000;
  const ts = String(tsSeconds);
  const nowMsWithinWindow = tsSeconds * 1000 + 60_000;

  function sign(customTs = ts): string {
    const manifest = `id:${dataId};request-id:${requestId};ts:${customTs};`;
    return createHmac("sha256", secret).update(manifest).digest("hex");
  }

  it("accepts valid x-signature within timestamp window", () => {
    const hash = sign();
    const header = `ts=${ts},v1=${hash}`;
    expect(
      mercadoPagoVerifyWebhookSignature({
        webhookSecret: secret,
        xSignature: header,
        xRequestId: requestId,
        dataId,
        nowMs: nowMsWithinWindow,
      }),
    ).toBe(true);
  });

  it("rejects invalid hash", () => {
    expect(
      mercadoPagoVerifyWebhookSignature({
        webhookSecret: secret,
        xSignature: `ts=${ts},v1=deadbeef`,
        xRequestId: requestId,
        dataId,
        nowMs: nowMsWithinWindow,
      }),
    ).toBe(false);
  });

  it("rejects missing headers", () => {
    expect(
      mercadoPagoVerifyWebhookSignature({
        webhookSecret: secret,
        xSignature: null,
        xRequestId: requestId,
        dataId,
        nowMs: nowMsWithinWindow,
      }),
    ).toBe(false);
  });

  it("rejects expired timestamp (>5 min old)", () => {
    const hash = sign();
    const header = `ts=${ts},v1=${hash}`;
    const tooLateMs = tsSeconds * 1000 + 6 * 60 * 1000;
    expect(
      mercadoPagoVerifyWebhookSignature({
        webhookSecret: secret,
        xSignature: header,
        xRequestId: requestId,
        dataId,
        nowMs: tooLateMs,
      }),
    ).toBe(false);
  });

  it("rejects future timestamp (>5 min ahead)", () => {
    const hash = sign();
    const header = `ts=${ts},v1=${hash}`;
    const tooEarlyMs = tsSeconds * 1000 - 6 * 60 * 1000;
    expect(
      mercadoPagoVerifyWebhookSignature({
        webhookSecret: secret,
        xSignature: header,
        xRequestId: requestId,
        dataId,
        nowMs: tooEarlyMs,
      }),
    ).toBe(false);
  });

  it("accepts timestamp at exact boundary (5 min)", () => {
    const hash = sign();
    const header = `ts=${ts},v1=${hash}`;
    const exactBoundaryMs = tsSeconds * 1000 + 5 * 60 * 1000;
    expect(
      mercadoPagoVerifyWebhookSignature({
        webhookSecret: secret,
        xSignature: header,
        xRequestId: requestId,
        dataId,
        nowMs: exactBoundaryMs,
      }),
    ).toBe(true);
  });
});
