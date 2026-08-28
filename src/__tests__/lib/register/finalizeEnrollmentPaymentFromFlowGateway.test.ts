/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({
  flowStatus: vi.fn(),
  apply: vi.fn(),
}));

vi.mock("@/lib/payment-gateways/flow/flowFetchPaymentStatus", () => ({
  flowFetchPaymentStatus: mocks.flowStatus,
}));
vi.mock("@/lib/register/applyEnrollmentGatewayCapture", () => ({
  applyEnrollmentGatewayCapture: mocks.apply,
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import { finalizeEnrollmentPaymentFromFlowGateway } from "@/lib/register/finalizeEnrollmentPaymentFromFlowGateway";

const REG_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function mockAdmin(registrationId: string | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: registrationId ? { registration_id: registrationId } : null,
            error: null,
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.apply.mockResolvedValue({ ok: true, studentId: "stu-1" });
});

describe("finalizeEnrollmentPaymentFromFlowGateway", () => {
  it("skips when Flow has not captured the payment", async () => {
    mocks.flowStatus.mockResolvedValue({
      ok: true,
      data: { status: 1, commerceOrder: "MAT-2026-00000001", amount: 15000, currency: "CLP" },
    });
    const result = await finalizeEnrollmentPaymentFromFlowGateway({
      admin: mockAdmin(REG_ID),
      apiBaseUrl: "https://flow.test",
      apiKey: "k",
      secretKey: "s",
      token: "tok",
    });
    expect(result).toEqual({ ok: true, skipped: "flow_not_paid" });
    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it("resolves the MAT- ref and applies the capture", async () => {
    mocks.flowStatus.mockResolvedValue({
      ok: true,
      data: {
        status: 2,
        commerceOrder: "MAT-2026-00000001",
        amount: 15000,
        currency: "CLP",
      },
    });
    const result = await finalizeEnrollmentPaymentFromFlowGateway({
      admin: mockAdmin(REG_ID),
      apiBaseUrl: "https://flow.test",
      apiKey: "k",
      secretKey: "s",
      token: "tok",
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
