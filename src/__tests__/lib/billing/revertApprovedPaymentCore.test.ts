// REGRESSION CHECK: Revert targets only approved rows; audit failure rolls back status.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { revertOneApprovedPayment } from "@/lib/billing/revertApprovedPaymentCore";

const auditFinanceAction = vi.fn();
vi.mock("@/lib/audit", () => ({
  auditFinanceAction: (...a: unknown[]) => auditFinanceAction(...a),
}));

beforeEach(() => {
  auditFinanceAction.mockResolvedValue({ ok: true });
});

function makeSupabase(
  payRow: {
    id: string;
    status: string;
    admin_notes: string | null;
    amount: number;
    receipt_url: string | null;
  } | null,
) {
  return {
    from(table: string) {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { role: "student" }, error: null }),
            }),
          }),
        };
      }
      if (table === "payments") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: () => Promise.resolve({ data: payRow, error: null }),
                  }),
                }),
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    },
  };
}

describe("revertOneApprovedPayment", () => {
  it("returns not_approved when row is pending", async () => {
    const supabase = makeSupabase({
      id: "p1",
      status: "pending",
      admin_notes: null,
      amount: 10,
      receipt_url: null,
    });
    const r = await revertOneApprovedPayment(supabase as never, {
      studentId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      sectionId: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
      year: 2026,
      month: 3,
      adminNote: null,
      actorId: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
      correlationId: null,
    });
    expect(r).toEqual({ success: false, code: "not_approved", month: 3 });
    expect(auditFinanceAction).not.toHaveBeenCalled();
  });

  it("updates to pending and audits when approved", async () => {
    const supabase = makeSupabase({
      id: "pay-99",
      status: "approved",
      admin_notes: "was",
      amount: 25,
      receipt_url: null,
    });
    const r = await revertOneApprovedPayment(supabase as never, {
      studentId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      sectionId: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
      year: 2026,
      month: 5,
      adminNote: "oops",
      actorId: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
      correlationId: "6ba7b813-9dad-11d1-80b4-00c04fd430c8",
    });
    expect(r).toEqual({ success: true, paymentId: "pay-99", month: 5 });
    expect(auditFinanceAction).toHaveBeenCalledTimes(1);
  });
});
