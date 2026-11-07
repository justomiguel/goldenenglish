/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  auditFinanceAction: (...args: unknown[]) => mocks.audit(...args),
}));
vi.mock("@/lib/billing/annualSettlementCleanupAfterPaymentRevert", () => ({
  maybeRemoveAnnualSettlementIfFullyReverted: vi.fn(async () => undefined),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { revertOneApprovedPayment } from "@/lib/billing/revertApprovedPaymentCore";

const STUDENT = "00000000-0000-4000-8000-000000000001";
const SECTION = "00000000-0000-4000-8000-000000000002";

function supabase() {
  const writes: unknown[] = [];
  function query(table: string) {
    const q = {
      select: () => q,
      eq: () => q,
      update: (values: unknown) => {
        writes.push(values);
        return q;
      },
      maybeSingle: async () =>
        table === "profiles"
          ? { data: { role: "student" }, error: null }
          : {
              data: {
                id: "pay-1",
                status: "approved",
                amount: 10000,
                admin_notes: null,
                receipt_url: null,
              },
              error: null,
            },
      single: async () => ({ data: { role: "student" }, error: null }),
      then: (resolve: (value: { error: null }) => void) => resolve({ error: null }),
    };
    return q;
  }
  return { client: { from: query }, writes };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.audit.mockResolvedValue({ ok: true });
});

describe("revertOneApprovedPayment", () => {
  it("clears the method and the date when the payment goes back to pending", async () => {
    const db = supabase();
    const result = await revertOneApprovedPayment(db.client as never, {
      studentId: STUDENT,
      sectionId: SECTION,
      year: 2026,
      month: 3,
      adminNote: null,
      actorId: "admin-1",
      correlationId: null,
    });
    expect(result).toMatchObject({ success: true, paymentId: "pay-1" });
    expect(db.writes[0]).toMatchObject({
      status: "pending",
      payment_method: null,
      paid_on: null,
    });
  });
});
