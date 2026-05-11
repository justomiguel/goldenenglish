import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { finalizeMonthlyPaymentFromFlowGateway } from "@/lib/billing/finalizeMonthlyPaymentFromFlowGateway";

vi.mock("@/lib/payment-gateways/flow/flowFetchPaymentStatus", () => ({
  flowFetchPaymentStatus: vi.fn(),
}));

vi.mock("@/lib/billing/resolveSectionPlanMonthlyAmount", () => ({
  resolveSectionPlanMonthlyAmount: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  auditFinanceAction: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/email/billingPaymentEmails", () => ({
  notifyMonthlyPaymentDecision: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock(
  "@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling",
  () => ({
    revalidateStudentBillingPaths: vi.fn(),
  }),
);

import { flowFetchPaymentStatus } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";
import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";

const mockFlow = vi.mocked(flowFetchPaymentStatus);
const mockPlan = vi.mocked(resolveSectionPlanMonthlyAmount);

const PAID = 2;
const paymentUuid = "11111111-1111-4111-8111-111111111111";

function flowOk(over: Partial<{ commerceOrder: string; status: number; amount: number }>) {
  return {
    ok: true as const,
    data: {
      flowOrder: 42,
      commerceOrder: over.commerceOrder ?? paymentUuid,
      status: over.status ?? PAID,
      amount: over.amount ?? 100_000,
      currency: "CLP",
    },
  };
}

describe("finalizeMonthlyPaymentFromFlowGateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok:false when Flow getStatus fails", async () => {
    mockFlow.mockResolvedValue({ ok: false, error: "flow_status_http_500" });
    const admin = { from: vi.fn() } as unknown as SupabaseClient;
    const r = await finalizeMonthlyPaymentFromFlowGateway({
      admin,
      apiBaseUrl: "https://sandbox.flow.cl/api",
      apiKey: "k",
      secretKey: "s",
      token: "t",
    });
    expect(r.ok).toBe(false);
  });

  it("skips when status is not paid", async () => {
    mockFlow.mockResolvedValue(flowOk({ status: 1 }));
    const admin = { from: vi.fn() } as unknown as SupabaseClient;
    const r = await finalizeMonthlyPaymentFromFlowGateway({
      admin,
      apiBaseUrl: "https://sandbox.flow.cl/api",
      apiKey: "k",
      secretKey: "s",
      token: "t",
    });
    expect(r).toEqual({ ok: true, skipped: "flow_status_1" });
  });

  it("skips invalid commerceOrder", async () => {
    mockFlow.mockResolvedValue(flowOk({ commerceOrder: "not-a-uuid" }));
    const admin = {
      from: (table: string) => {
        if (table === "payment_flow_checkout_refs") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        return undefined;
      },
    } as unknown as SupabaseClient;
    const r = await finalizeMonthlyPaymentFromFlowGateway({
      admin,
      apiBaseUrl: "https://sandbox.flow.cl/api",
      apiKey: "k",
      secretKey: "s",
      token: "t",
    });
    expect(r).toEqual({ ok: true, skipped: "invalid_commerce_order" });
  });

  it("is idempotent when payment already approved", async () => {
    mockFlow.mockResolvedValue(flowOk({}));
    const admin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: paymentUuid,
                student_id: "22222222-2222-4222-8222-222222222222",
                section_id: "33333333-3333-4333-8333-333333333333",
                month: 3,
                year: 2026,
                amount: 100_000,
                status: "approved",
                admin_notes: null,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const r = await finalizeMonthlyPaymentFromFlowGateway({
      admin,
      apiBaseUrl: "https://sandbox.flow.cl/api",
      apiKey: "k",
      secretKey: "s",
      token: "t",
    });
    expect(r).toEqual({ ok: true, approved: true, paymentId: paymentUuid });
  });

  it("updates pending payment to approved when plan amount matches Flow", async () => {
    mockFlow.mockResolvedValue(flowOk({ amount: 100_000 }));
    mockPlan.mockResolvedValue({
      code: "ok",
      amount: 100_000,
      currency: "CLP",
      proration: { numerator: 1, denominator: 1, full: true },
    });

    const admin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: paymentUuid,
                student_id: "22222222-2222-4222-8222-222222222222",
                section_id: "33333333-3333-4333-8333-333333333333",
                month: 3,
                year: 2026,
                amount: 99_000,
                status: "pending",
                admin_notes: null,
              },
              error: null,
            }),
          }),
        }),
        update: () => ({
          eq: () => ({
            in: async () => ({ error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const r = await finalizeMonthlyPaymentFromFlowGateway({
      admin,
      apiBaseUrl: "https://sandbox.flow.cl/api",
      apiKey: "k",
      secretKey: "s",
      token: "t",
    });
    expect(r).toEqual({ ok: true, approved: true, paymentId: paymentUuid });
  });

  it("skips Flow getStatus when flowPaidSnapshot is provided (browser return)", async () => {
    mockFlow.mockResolvedValue({ ok: false, error: "should_not_fetch" });
    mockPlan.mockResolvedValue({
      code: "ok",
      amount: 100_000,
      currency: "CLP",
      proration: { numerator: 1, denominator: 1, full: true },
    });

    const admin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: paymentUuid,
                student_id: "22222222-2222-4222-8222-222222222222",
                section_id: "33333333-3333-4333-8333-333333333333",
                month: 3,
                year: 2026,
                amount: 100_000,
                status: "pending",
                admin_notes: null,
              },
              error: null,
            }),
          }),
        }),
        update: () => ({
          eq: () => ({
            in: async () => ({ error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const snap = flowOk({ amount: 100_000 }).data;
    const r = await finalizeMonthlyPaymentFromFlowGateway({
      admin,
      apiBaseUrl: "https://sandbox.flow.cl/api",
      apiKey: "k",
      secretKey: "s",
      token: "t",
      flowPaidSnapshot: snap,
    });
    expect(mockFlow).not.toHaveBeenCalled();
    expect(r.ok).toBe(true);
  });
});
