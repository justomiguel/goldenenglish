/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPayment: vi.fn(),
  apply: vi.fn(),
}));

vi.mock("@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment", () => ({
  mercadoPagoGetPayment: mocks.getPayment,
}));
vi.mock("@/lib/register/applyEnrollmentGatewayCapture", () => ({
  applyEnrollmentGatewayCapture: mocks.apply,
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import { finalizeEnrollmentPaymentFromMercadoPago } from "@/lib/register/finalizeEnrollmentPaymentFromMercadoPago";

const REG_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.apply.mockResolvedValue({ ok: true, studentId: "stu-1" });
});

describe("finalizeEnrollmentPaymentFromMercadoPago", () => {
  it("skips when Mercado Pago has not approved the payment", async () => {
    mocks.getPayment.mockResolvedValue({
      ok: true,
      data: { status: "pending", external_reference: `enrollment:${REG_ID}` },
    });
    const result = await finalizeEnrollmentPaymentFromMercadoPago({
      admin: {} as never,
      accessToken: "tok",
      mpPaymentId: "1",
    });
    expect(result).toEqual({ ok: true, skipped: "mp_not_approved" });
    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it("applies the capture from enrollment:<uuid>", async () => {
    mocks.getPayment.mockResolvedValue({
      ok: true,
      data: {
        status: "approved",
        external_reference: `enrollment:${REG_ID}`,
        transaction_amount: 15000,
        currency_id: "CLP",
      },
    });
    const result = await finalizeEnrollmentPaymentFromMercadoPago({
      admin: {} as never,
      accessToken: "tok",
      mpPaymentId: "1",
    });
    expect(result).toEqual({ ok: true, studentId: "stu-1" });
    expect(mocks.apply).toHaveBeenCalledWith({
      admin: expect.anything(),
      registrationId: REG_ID,
      gatewayAmount: 15000,
      gatewayCurrency: "CLP",
      locale: "es",
    });
  });
});
