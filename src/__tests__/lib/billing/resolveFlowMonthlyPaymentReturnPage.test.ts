import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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

const loadKeyMock = vi.fn(() => Buffer.alloc(32));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/payment-gateways/loadPaymentGatewayEncryptionKey", () => ({
  loadPaymentGatewayEncryptionKeyRaw32: () => loadKeyMock(),
}));

const credsState = { enabled: true };

vi.mock("@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain", () => ({
  flowChileApiBase: () => "https://flow.test",
  loadFlowChileCredentialsPlain: async () => ({
    enabled: credsState.enabled,
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

const lookup = vi.fn();
vi.mock("@/lib/billing/lookupPaymentRowForFlowFinalize", () => ({
  lookupPaymentRowForFlowFinalize: (...args: unknown[]) => lookup(...args),
}));

import { createAdminClient } from "@/lib/supabase/admin";

function userSupabase(opts: {
  canSeePayment: boolean;
  secondSelect?: { status: string; month: number | null; year: number | null } | null;
}) {
  return {
    from: vi.fn((t: string) => {
      expect(t).toBe("payments");
      return {
        select: (cols: string) => ({
          eq: () => ({
            maybeSingle: async () => {
              if (cols === "id") {
                return {
                  data: opts.canSeePayment ? { id: paymentUuid } : null,
                  error: null,
                };
              }
              return {
                data: opts.secondSelect ?? { status: "approved", month: 5, year: 2026 },
                error: null,
              };
            },
          }),
        }),
      };
    }),
  } as unknown as SupabaseClient;
}

describe("resolveFlowMonthlyPaymentReturnPage", () => {
  beforeEach(() => {
    credsState.enabled = true;
    loadKeyMock.mockImplementation(() => Buffer.alloc(32));
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
    lookup.mockResolvedValue({
      payRow: {
        id: paymentUuid,
        student_id: payRow.student_id,
        section_id: payRow.section_id,
        month: 5,
        year: 2026,
        amount: 100000,
        status: "pending",
        admin_notes: null,
      },
      error: null,
    });
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn() } as unknown as SupabaseClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns success when Flow paid, lookup matches, user sees row, finalize ok, payment approved", async () => {
    const result = await resolveFlowMonthlyPaymentReturnPage({
      supabase: userSupabase({ canSeePayment: true }),
      token: "flow-token",
    });

    expect(result).toEqual({
      outcome: "success",
      month: 5,
      year: 2026,
      paymentId: paymentUuid,
    });
    expect(lookup).toHaveBeenCalledWith(expect.any(Object), "MES-2026-05-00000001");
    expect(finalize).toHaveBeenCalled();
  });

  it("returns no_token when token missing", async () => {
    await expect(
      resolveFlowMonthlyPaymentReturnPage({ supabase: userSupabase({ canSeePayment: true }), token: undefined }),
    ).resolves.toEqual({ outcome: "no_token" });
  });

  it("returns misconfigured when encryption key missing", async () => {
    loadKeyMock.mockImplementation(() => {
      throw new Error("no key");
    });
    await expect(
      resolveFlowMonthlyPaymentReturnPage({ supabase: userSupabase({ canSeePayment: true }), token: "t" }),
    ).resolves.toEqual({ outcome: "misconfigured" });
  });

  it("returns misconfigured when Flow credentials disabled", async () => {
    credsState.enabled = false;
    await expect(
      resolveFlowMonthlyPaymentReturnPage({ supabase: userSupabase({ canSeePayment: true }), token: "t" }),
    ).resolves.toEqual({ outcome: "misconfigured" });
  });

  it("returns status_failed when Flow status fetch fails", async () => {
    flowFetch.mockResolvedValueOnce({ ok: false, error: "boom" });
    await expect(
      resolveFlowMonthlyPaymentReturnPage({ supabase: userSupabase({ canSeePayment: true }), token: "t" }),
    ).resolves.toEqual({ outcome: "status_failed" });
  });

  it("returns not_paid when Flow status is not paid", async () => {
    flowFetch.mockResolvedValueOnce({
      ok: true,
      data: {
        flowOrder: 1,
        commerceOrder: "MES-1",
        status: 1,
        amount: 1,
        currency: "CLP",
      },
    });
    await expect(
      resolveFlowMonthlyPaymentReturnPage({ supabase: userSupabase({ canSeePayment: true }), token: "t" }),
    ).resolves.toEqual({ outcome: "not_paid" });
  });

  it("returns reconcile_error when lookup errors", async () => {
    lookup.mockResolvedValueOnce({ payRow: undefined, error: new Error("db") });
    await expect(
      resolveFlowMonthlyPaymentReturnPage({ supabase: userSupabase({ canSeePayment: true }), token: "t" }),
    ).resolves.toEqual({ outcome: "reconcile_error" });
  });

  it("returns reconcile_error when commerce order invalid", async () => {
    lookup.mockResolvedValueOnce({
      payRow: undefined,
      error: null,
      skipReason: "invalid_commerce_order",
    });
    await expect(
      resolveFlowMonthlyPaymentReturnPage({ supabase: userSupabase({ canSeePayment: true }), token: "t" }),
    ).resolves.toEqual({ outcome: "reconcile_error" });
  });

  it("returns unauthorized_payment when session cannot see payments row", async () => {
    await expect(
      resolveFlowMonthlyPaymentReturnPage({
        supabase: userSupabase({ canSeePayment: false }),
        token: "t",
      }),
    ).resolves.toEqual({ outcome: "unauthorized_payment" });
  });

  it("returns reconcile_error when finalize returns not ok", async () => {
    finalize.mockResolvedValueOnce({ ok: false, approved: false });
    await expect(
      resolveFlowMonthlyPaymentReturnPage({ supabase: userSupabase({ canSeePayment: true }), token: "t" }),
    ).resolves.toEqual({ outcome: "reconcile_error" });
  });

  it("returns processing when payment not yet approved after finalize", async () => {
    await expect(
      resolveFlowMonthlyPaymentReturnPage({
        supabase: userSupabase({
          canSeePayment: true,
          secondSelect: { status: "pending", month: 5, year: 2026 },
        }),
        token: "t",
      }),
    ).resolves.toEqual({ outcome: "processing" });
  });
});
