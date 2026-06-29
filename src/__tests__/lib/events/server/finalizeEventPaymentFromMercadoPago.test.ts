import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMpGetPayment = vi.fn();
const mockMarkApproved = vi.fn();
const mockUpsertApproved = vi.fn();

vi.mock("@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment", () => ({
  mercadoPagoGetPayment: (...args: unknown[]) => mockMpGetPayment(...args),
}));

vi.mock("@/lib/events/server/markEventPaymentApprovedCore", () => ({
  markEventPaymentApprovedCore: (...args: unknown[]) => mockMarkApproved(...args),
}));

vi.mock("@/lib/events/server/upsertApprovedEventGatewayPaymentCore", () => ({
  upsertApprovedEventGatewayPaymentCore: (...args: unknown[]) => mockUpsertApproved(...args),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { finalizeEventPaymentFromMercadoPago } from "@/lib/events/server/finalizeEventPaymentFromMercadoPago";

describe("finalizeEventPaymentFromMercadoPago", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMarkApproved.mockResolvedValue({ ok: true, paymentId: "pay-1", paymentUpdated: true, attendeeConfirmed: true });
    mockUpsertApproved.mockResolvedValue({ ok: true, paymentId: "pay-1" });
  });

  it("returns ok false when Mercado Pago lookup fails", async () => {
    mockMpGetPayment.mockResolvedValue({ ok: false });

    const result = await finalizeEventPaymentFromMercadoPago({
      admin: { from: vi.fn() } as never,
      accessToken: "token",
      mpPaymentId: "999",
    });

    expect(result).toEqual({ ok: false });
  });

  it("skips when Mercado Pago payment is not approved", async () => {
    mockMpGetPayment.mockResolvedValue({
      ok: true,
      data: { status: "pending", external_reference: "event_payment:pay-1" },
    });

    const result = await finalizeEventPaymentFromMercadoPago({
      admin: { from: vi.fn() } as never,
      accessToken: "token",
      mpPaymentId: "999",
    });

    expect(result).toEqual({ ok: true, skipped: "mp_not_approved" });
  });

  it("skips when external reference is missing", async () => {
    mockMpGetPayment.mockResolvedValue({
      ok: true,
      data: { status: "approved", external_reference: "" },
    });

    const result = await finalizeEventPaymentFromMercadoPago({
      admin: { from: vi.fn() } as never,
      accessToken: "token",
      mpPaymentId: "999",
    });

    expect(result).toEqual({ ok: true, skipped: "missing_external_reference" });
  });

  it("approves the event payment and stores finalize metadata", async () => {
    mockMpGetPayment.mockResolvedValue({
      ok: true,
      data: {
        id: 999,
        status: "approved",
        external_reference: "event_payment:pay-1",
        date_approved: "2026-06-24T12:00:00.000Z",
        currency_id: "ARS",
        transaction_amount: 150,
        payer: { email: "payer@example.com" },
        payment_method_id: "visa",
      },
    });

    const upsert = vi.fn(async () => ({ error: null }));
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "event_payments") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: { id: "pay-1" }, error: null })),
              })),
            })),
          };
        }
        if (table === "event_payment_mp_finalize_records") {
          return { upsert };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    };

    const result = await finalizeEventPaymentFromMercadoPago({
      admin: admin as never,
      accessToken: "token",
      mpPaymentId: "999",
    });

    expect(result).toEqual({ ok: true, paymentId: "pay-1" });
    expect(mockMarkApproved).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "pay-1",
        gatewayProvider: "mercadopago",
      }),
    );
    expect(upsert).toHaveBeenCalled();
  });

  it("materializes an approved payment for an attendee reference (deferred creation)", async () => {
    mockMpGetPayment.mockResolvedValue({
      ok: true,
      data: {
        id: 1001,
        status: "approved",
        external_reference: "event_attendee:att-1",
        date_approved: "2026-06-24T12:00:00.000Z",
        currency_id: "CLP",
        transaction_amount: 15000,
        payer: { email: "payer@example.com" },
        payment_method_id: "visa",
      },
    });

    const upsertRecord = vi.fn(async () => ({ error: null }));
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "event_payment_mp_finalize_records") {
          return { upsert: upsertRecord };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    };

    const result = await finalizeEventPaymentFromMercadoPago({
      admin: admin as never,
      accessToken: "token",
      mpPaymentId: "1001",
    });

    expect(result).toEqual({ ok: true, paymentId: "pay-1" });
    expect(mockUpsertApproved).toHaveBeenCalledWith(
      expect.objectContaining({ attendeeId: "att-1", gatewayProvider: "mercadopago" }),
    );
    expect(mockMarkApproved).not.toHaveBeenCalled();
    expect(upsertRecord).toHaveBeenCalled();
  });

  it("skips when the attendee no longer exists", async () => {
    mockMpGetPayment.mockResolvedValue({
      ok: true,
      data: { id: 1001, status: "approved", external_reference: "event_attendee:att-x" },
    });
    mockUpsertApproved.mockResolvedValue({ ok: true, skipped: "event_attendee_not_found" });

    const result = await finalizeEventPaymentFromMercadoPago({
      admin: { from: vi.fn() } as never,
      accessToken: "token",
      mpPaymentId: "1001",
    });

    expect(result).toEqual({ ok: true, skipped: "event_attendee_not_found" });
  });

  it("returns ok false when approval core fails", async () => {
    mockMpGetPayment.mockResolvedValue({
      ok: true,
      data: {
        id: 999,
        status: "approved",
        external_reference: "event_payment:pay-1",
      },
    });
    mockMarkApproved.mockResolvedValue({ ok: false, code: "update_failed" });

    const admin = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: { id: "pay-1" }, error: null })),
          })),
        })),
      })),
    };

    const result = await finalizeEventPaymentFromMercadoPago({
      admin: admin as never,
      accessToken: "token",
      mpPaymentId: "999",
    });

    expect(result).toEqual({ ok: false });
  });
});
