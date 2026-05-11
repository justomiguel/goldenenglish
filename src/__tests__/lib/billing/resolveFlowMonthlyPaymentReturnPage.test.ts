import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveFlowMonthlyPaymentReturnPage } from "@/lib/billing/resolveFlowMonthlyPaymentReturnPage";

const paymentUuid = "11111111-1111-4111-8111-111111111111";

const payRow = {
  id: paymentUuid,
  student_id: "22222222-2222-4222-8222-222222222222",
  section_id: "33333333-3333-4333-8333-333333333333",
  month: 5,
  year: 2026,
  amount: 100000,
  status: "pending",
  admin_notes: null,
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/payment-gateways/loadPaymentGatewayEncryptionKey", () => ({
  loadPaymentGatewayEncryptionKeyRaw32: () => Buffer.alloc(32),
}));

vi.mock("@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain", () => ({
  flowChileApiBase: () => "https://flow.test",
  loadFlowChileCredentialsPlain: async () => ({
    enabled: true,
    apiKey: "k",
    secretKey: "s",
  }),
}));

const flowFetch = vi.fn();
vi.mock("@/lib/payment-gateways/flow/flowFetchPaymentStatus", () => ({
  flowFetchPaymentStatus: (...args: unknown[]) => flowFetch(...args),
}));

const finalize = vi.fn();
vi.mock("@/lib/billing/finalizeMonthlyPaymentFromFlowGateway", () => ({
  finalizeMonthlyPaymentFromFlowGateway: (...args: unknown[]) => finalize(...args),
}));

import { createAdminClient } from "@/lib/supabase/admin";

describe("resolveFlowMonthlyPaymentReturnPage", () => {
  beforeEach(() => {
    flowFetch.mockResolvedValue({
      ok: true,
      data: {
        flowOrder: 1,
        commerceOrder: "MES-2026-05-00000001",
        status: 2,
        amount: 100000,
        currency: "CLP",
      },
    });
    finalize.mockResolvedValue({ ok: true, approved: true });
  });

  it("resolves MES-* commerceOrder via payment_flow_checkout_refs (not only UUID)", async () => {
    const fromAdmin = vi.fn((t: string) => {
      if (t === "payment_flow_checkout_refs") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { payment_id: paymentUuid },
                error: null,
              }),
            }),
          }),
        };
      }
      if (t === "payments") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: payRow,
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected admin table ${t}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from: fromAdmin } as unknown as SupabaseClient);

    const userPaymentsSelect = vi.fn();
    const userFrom = vi.fn((t: string) => {
      expect(t).toBe("payments");
      return {
        select: (cols: string) => ({
          eq: () => ({
            maybeSingle: async () => {
              userPaymentsSelect(cols);
              if (cols === "id") {
                return { data: { id: paymentUuid }, error: null };
              }
              return {
                data: { status: "approved", month: 5, year: 2026 },
                error: null,
              };
            },
          }),
        }),
      };
    });

    const result = await resolveFlowMonthlyPaymentReturnPage({
      supabase: { from: userFrom } as unknown as SupabaseClient,
      token: "flow-token",
    });

    expect(result).toEqual({ outcome: "success", month: 5, year: 2026 });
    expect(fromAdmin.mock.calls.some((c) => c[0] === "payment_flow_checkout_refs")).toBe(true);
    expect(finalize).toHaveBeenCalled();
  });
});
