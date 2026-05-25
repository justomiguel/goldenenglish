/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { mercadoPagoCreatePreference } from "@/lib/payment-gateways/mercadopago/mercadoPagoCreatePreference";

describe("mercadoPagoCreatePreference", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns init_point for sandbox environment", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            id: "pref-123",
            sandbox_init_point: "https://sandbox.mp/redirect",
          }),
      })),
    );

    const result = await mercadoPagoCreatePreference({
      accessToken: "token",
      environment: "sandbox",
      title: "Monthly fee",
      unitPrice: 50000,
      currencyId: "CLP",
      externalReference: "pay-id",
      payerEmail: "student@e.com",
      notificationUrl: "https://example.com/webhook",
      backUrls: {
        success: "https://example.com/ok",
        failure: "https://example.com/fail",
        pending: "https://example.com/pending",
      },
    });

    expect(result).toEqual({
      ok: true,
      preferenceId: "pref-123",
      redirectUrl: "https://sandbox.mp/redirect",
    });
  });

  it("returns error when API responds non-ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 400,
        text: async () => "bad request",
      })),
    );

    const result = await mercadoPagoCreatePreference({
      accessToken: "token",
      environment: "production",
      title: "Fee",
      unitPrice: 1,
      currencyId: "CLP",
      externalReference: "x",
      payerEmail: "a@b.c",
      notificationUrl: "https://example.com/webhook",
      backUrls: {
        success: "https://example.com/ok",
        failure: "https://example.com/fail",
        pending: "https://example.com/pending",
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure");
    expect(result.status).toBe(400);
  });
});
