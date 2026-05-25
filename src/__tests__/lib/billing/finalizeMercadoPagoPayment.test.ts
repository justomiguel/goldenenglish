/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { finalizeMercadoPagoPayment } from "@/lib/billing/finalizeMercadoPagoPayment";
import type { MercadoPagoPaymentPayload } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";

vi.mock("@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment", () => ({
  mercadoPagoGetPayment: vi.fn(),
}));

vi.mock("@/lib/billing/resolveSectionPlanMonthlyAmount", () => ({
  resolveSectionPlanMonthlyAmount: vi.fn(),
}));

vi.mock("@/lib/billing/upsertMpFinalizeRecord", () => ({
  upsertMpFinalizeRecord: vi.fn(async () => ({ ok: true })),
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

vi.mock("@/lib/i18n/resolveUserLocale", () => ({
  resolveUserLocale: vi.fn(async () => "es"),
}));

import { mercadoPagoGetPayment } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";
import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";
import { upsertMpFinalizeRecord } from "@/lib/billing/upsertMpFinalizeRecord";

const mockGetPayment = vi.mocked(mercadoPagoGetPayment);
const mockPlan = vi.mocked(resolveSectionPlanMonthlyAmount);
const mockUpsert = vi.mocked(upsertMpFinalizeRecord);

const paymentUuid = "11111111-1111-4111-8111-111111111111";

function mpApproved(over: Partial<MercadoPagoPaymentPayload> = {}): MercadoPagoPaymentPayload {
  return {
    id: 999,
    status: "approved",
    status_detail: "accredited",
    transaction_amount: 100_000,
    currency_id: "CLP",
    external_reference: paymentUuid,
    date_approved: "2026-05-10T15:00:00Z",
    payment_method_id: "visa",
    payer: { email: "payer@e.com" },
    ...over,
  };
}

describe("finalizeMercadoPagoPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok:false when MercadoPago getPayment fails", async () => {
    mockGetPayment.mockResolvedValue({ ok: false, error: "http_500" });
    const admin = { from: vi.fn() } as unknown as SupabaseClient;
    const r = await finalizeMercadoPagoPayment({
      admin,
      accessToken: "token",
      mpPaymentId: "999",
    });
    expect(r.ok).toBe(false);
  });

  it("skips when MP status is not approved", async () => {
    mockGetPayment.mockResolvedValue({
      ok: true,
      data: mpApproved({ status: "pending" }),
    });
    const admin = { from: vi.fn() } as unknown as SupabaseClient;
    const r = await finalizeMercadoPagoPayment({
      admin,
      accessToken: "token",
      mpPaymentId: "999",
    });
    expect(r).toEqual({ ok: true, skipped: "mp_status_pending" });
  });

  it("is idempotent when payment already approved", async () => {
    mockGetPayment.mockResolvedValue({ ok: true, data: mpApproved() });
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
                mp_preference_id: "pref-1",
              },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const r = await finalizeMercadoPagoPayment({
      admin,
      accessToken: "token",
      mpPaymentId: "999",
    });
    expect(r).toEqual({ ok: true, approved: true, paymentId: paymentUuid });
    expect(mockUpsert).toHaveBeenCalled();
  });

  it("skips on currency mismatch", async () => {
    mockGetPayment.mockResolvedValue({
      ok: true,
      data: mpApproved({ currency_id: "ARS" }),
    });
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
                mp_preference_id: "pref-1",
                admin_notes: null,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const r = await finalizeMercadoPagoPayment({
      admin,
      accessToken: "token",
      mpPaymentId: "999",
    });
    expect(r).toEqual({ ok: true, skipped: "currency_mismatch" });
  });

  it("approves pending payment when plan amount matches", async () => {
    mockGetPayment.mockResolvedValue({ ok: true, data: mpApproved({ transaction_amount: 100_000 }) });
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
                mp_preference_id: "pref-1",
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
        insert: async () => ({ error: null }),
      }),
    } as unknown as SupabaseClient;

    const r = await finalizeMercadoPagoPayment({
      admin,
      accessToken: "token",
      mpPaymentId: "999",
    });
    expect(r).toEqual({ ok: true, approved: true, paymentId: paymentUuid });
    expect(mockUpsert).toHaveBeenCalled();
  });

  it("skips getPayment when mpPaidSnapshot is provided", async () => {
    mockGetPayment.mockResolvedValue({ ok: false, error: "should_not_fetch" });
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
                mp_preference_id: "pref-1",
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
        insert: async () => ({ error: null }),
      }),
    } as unknown as SupabaseClient;

    const r = await finalizeMercadoPagoPayment({
      admin,
      accessToken: "token",
      mpPaymentId: "999",
      mpPaidSnapshot: mpApproved({ transaction_amount: 100_000 }),
    });
    expect(mockGetPayment).not.toHaveBeenCalled();
    expect(r.ok).toBe(true);
  });
});
