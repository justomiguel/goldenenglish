import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lookupPaymentRowForFlowFinalize } from "@/lib/billing/lookupPaymentRowForFlowFinalize";

const paymentUuid = "11111111-1111-4111-8111-111111111111";

const payPayload = {
  id: paymentUuid,
  student_id: "22222222-2222-4222-8222-222222222222",
  section_id: "33333333-3333-4333-8333-333333333333",
  month: 3,
  year: 2026,
  amount: 100000,
  status: "pending",
  admin_notes: null,
};

describe("lookupPaymentRowForFlowFinalize", () => {
  it("looks up payments.id when commerceOrder is a UUID", async () => {
    const admin = {
      from: (t: string) => {
        expect(t).toBe("payments");
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: payPayload,
                error: null,
              }),
            }),
          }),
        };
      },
    };

    const r = await lookupPaymentRowForFlowFinalize(admin as unknown as SupabaseClient, paymentUuid);
    expect(r.error).toBeNull();
    expect(r.skipReason).toBeUndefined();
    expect(r.payRow?.id).toBe(paymentUuid);
  });

  it("maps non-uuid commerce ref via payment_flow_checkout_refs before payments", async () => {
    const from = vi.fn((t: string) => {
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
                data: payPayload,
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${t}`);
    });

    const r = await lookupPaymentRowForFlowFinalize(
      { from } as unknown as SupabaseClient,
      "MES-2026-05-00000001",
    );
    expect(r.payRow?.id).toBe(paymentUuid);
    expect(from.mock.calls.some((c) => c[0] === "payment_flow_checkout_refs")).toBe(true);
  });

  it("returns skipReason for stray commerce refs", async () => {
    const admin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    };

    const r = await lookupPaymentRowForFlowFinalize(admin as unknown as SupabaseClient, "MES-x");
    expect(r.skipReason).toBe("invalid_commerce_order");
  });
});
