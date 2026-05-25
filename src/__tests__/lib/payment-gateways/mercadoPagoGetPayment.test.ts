/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { mercadoPagoGetPayment } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";

describe("mercadoPagoGetPayment", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses approved payment payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            id: 42,
            status: "approved",
            status_detail: "accredited",
            transaction_amount: 1000,
            currency_id: "CLP",
            external_reference: "uuid",
            date_approved: "2026-05-10T12:00:00Z",
            payment_method_id: "visa",
          }),
      })),
    );

    const result = await mercadoPagoGetPayment({
      accessToken: "token",
      paymentId: "42",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.data.status).toBe("approved");
    expect(result.data.transaction_amount).toBe(1000);
  });

  it("returns error on HTTP failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 404,
        text: async () => "not found",
      })),
    );

    const result = await mercadoPagoGetPayment({
      accessToken: "token",
      paymentId: "missing",
    });

    expect(result).toEqual({ ok: false, error: "not found", status: 404 });
  });
});
