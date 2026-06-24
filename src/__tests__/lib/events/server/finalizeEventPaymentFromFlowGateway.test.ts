import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFlowStatus = vi.fn();
const mockMarkApproved = vi.fn();

vi.mock("@/lib/payment-gateways/flow/flowFetchPaymentStatus", () => ({
  flowFetchPaymentStatus: (...args: unknown[]) => mockFlowStatus(...args),
}));

vi.mock("@/lib/events/server/markEventPaymentApprovedCore", () => ({
  markEventPaymentApprovedCore: (...args: unknown[]) => mockMarkApproved(...args),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { finalizeEventPaymentFromFlowGateway } from "@/lib/events/server/finalizeEventPaymentFromFlowGateway";

describe("finalizeEventPaymentFromFlowGateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMarkApproved.mockResolvedValue({ ok: true, paymentId: "pay-flow", paymentUpdated: true, attendeeConfirmed: true });
  });

  it("returns ok false when Flow status lookup fails", async () => {
    mockFlowStatus.mockResolvedValue({ ok: false });

    const result = await finalizeEventPaymentFromFlowGateway({
      admin: { from: vi.fn() } as never,
      apiBaseUrl: "https://flow.test",
      apiKey: "key",
      secretKey: "secret",
      token: "token",
    });

    expect(result).toEqual({ ok: false });
  });

  it("skips when Flow reports an unpaid status", async () => {
    mockFlowStatus.mockResolvedValue({
      ok: true,
      data: { status: 1, commerceOrder: "event_payment:pay-flow" },
    });

    const result = await finalizeEventPaymentFromFlowGateway({
      admin: { from: vi.fn() } as never,
      apiBaseUrl: "https://flow.test",
      apiKey: "key",
      secretKey: "secret",
      token: "token",
    });

    expect(result).toEqual({ ok: true, skipped: "flow_not_paid" });
  });

  it("skips when commerce order does not include a payment id", async () => {
    mockFlowStatus.mockResolvedValue({
      ok: true,
      data: { status: 2, commerceOrder: "invalid-order" },
    });

    const result = await finalizeEventPaymentFromFlowGateway({
      admin: { from: vi.fn() } as never,
      apiBaseUrl: "https://flow.test",
      apiKey: "key",
      secretKey: "secret",
      token: "token",
    });

    expect(result).toEqual({ ok: true, skipped: "missing_payment_id" });
  });

  it("approves the event payment and stores finalize metadata", async () => {
    mockFlowStatus.mockResolvedValue({
      ok: true,
      data: {
        status: 2,
        commerceOrder: "event_payment:pay-flow",
        flowOrder: 12345,
        currency: "CLP",
        amount: 15000,
        payer: "payer@example.com",
        paymentData: { date: "2026-06-24T12:00:00.000Z", media: "webpay" },
      },
    });

    const upsert = vi.fn(async () => ({ error: null }));
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "event_payment_flow_finalize_records") {
          return { upsert };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    };

    const result = await finalizeEventPaymentFromFlowGateway({
      admin: admin as never,
      apiBaseUrl: "https://flow.test",
      apiKey: "key",
      secretKey: "secret",
      token: "token",
    });

    expect(result).toEqual({ ok: true, paymentId: "pay-flow" });
    expect(mockMarkApproved).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "pay-flow",
        gatewayProvider: "flow",
      }),
    );
    expect(upsert).toHaveBeenCalled();
  });

  it("skips when event payment row is missing", async () => {
    mockFlowStatus.mockResolvedValue({
      ok: true,
      data: {
        status: 2,
        commerceOrder: "event_payment:pay-missing",
      },
    });
    mockMarkApproved.mockResolvedValue({ ok: false, code: "not_found" });

    const result = await finalizeEventPaymentFromFlowGateway({
      admin: { from: vi.fn() } as never,
      apiBaseUrl: "https://flow.test",
      apiKey: "key",
      secretKey: "secret",
      token: "token",
    });

    expect(result).toEqual({ ok: true, skipped: "event_payment_not_found" });
  });
});
