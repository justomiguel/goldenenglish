/** @vitest-environment node */
import { createHmac } from "node:crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFinalize = vi.fn();
const mockLoadCreds = vi.fn();
const mockLoadKey = vi.fn();
const mockAdmin = vi.fn();

vi.mock("@/lib/billing/finalizeMercadoPagoPayment", () => ({
  finalizeMercadoPagoPayment: (...args: unknown[]) => mockFinalize(...args),
}));

vi.mock("@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain", () => ({
  loadMercadoPagoCredentialsPlain: (...args: unknown[]) => mockLoadCreds(...args),
}));

vi.mock("@/lib/payment-gateways/loadPaymentGatewayEncryptionKey", () => ({
  loadPaymentGatewayEncryptionKeyRaw32: () => mockLoadKey(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdmin(),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
  logServerWarn: vi.fn(),
}));

import { POST } from "@/app/api/payments/mercadopago/webhook/route";

const secret = "webhook-secret";
const dataId = "123456789";
const requestId = "req-xyz";
const ts = String(Math.floor(Date.now() / 1000));

function sign(): string {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

function webhookRequest(opts?: { country?: string; signature?: string | null }) {
  const country = opts?.country ?? "CL";
  const hash = sign();
  const xSignature = opts?.signature === null ? null : (opts?.signature ?? `ts=${ts},v1=${hash}`);
  return new Request(
    `https://example.com/api/payments/mercadopago/webhook?country=${country}&data.id=${dataId}`,
    {
      method: "POST",
      headers: {
        "x-signature": xSignature ?? "",
        "x-request-id": requestId,
        "content-type": "application/json",
      },
      body: JSON.stringify({ type: "payment", data: { id: dataId } }),
    },
  );
}

describe("POST /api/payments/mercadopago/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadKey.mockReturnValue(Buffer.alloc(32));
    mockAdmin.mockReturnValue({});
    mockLoadCreds.mockResolvedValue({
      enabled: true,
      accessToken: "access-token",
      webhookSecret: secret,
    });
    mockFinalize.mockResolvedValue({ ok: true, approved: true });
  });

  it("returns 200 without finalize when country is missing", async () => {
    const res = await POST(
      new Request("https://example.com/api/payments/mercadopago/webhook", { method: "POST" }),
    );
    expect(res.status).toBe(200);
    expect(mockFinalize).not.toHaveBeenCalled();
  });

  it("returns 401 when signature is invalid", async () => {
    const res = await POST(webhookRequest({ signature: `ts=${ts},v1=badhash` }));
    expect(res.status).toBe(401);
    expect(mockFinalize).not.toHaveBeenCalled();
  });

  it("returns 200 and finalizes on valid signature", async () => {
    const res = await POST(webhookRequest());
    expect(res.status).toBe(200);
    expect(mockFinalize).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "access-token",
        mpPaymentId: dataId,
      }),
    );
  });

  it("skips finalization when body type is not payment", async () => {
    const hash = sign();
    const res = await POST(
      new Request(
        `https://example.com/api/payments/mercadopago/webhook?country=CL&data.id=${dataId}`,
        {
          method: "POST",
          headers: {
            "x-signature": `ts=${ts},v1=${hash}`,
            "x-request-id": requestId,
            "content-type": "application/json",
          },
          body: JSON.stringify({ type: "plan", data: { id: dataId } }),
        },
      ),
    );
    expect(res.status).toBe(200);
    expect(mockFinalize).not.toHaveBeenCalled();
  });

  it("processes webhook when body type is payment", async () => {
    const res = await POST(webhookRequest());
    expect(res.status).toBe(200);
    expect(mockFinalize).toHaveBeenCalled();
  });
});
