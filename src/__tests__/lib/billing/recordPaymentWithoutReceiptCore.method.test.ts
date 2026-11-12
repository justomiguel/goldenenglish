/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: vi.fn(),
  enrolled: vi.fn(),
  plan: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  auditFinanceAction: (...args: unknown[]) => mocks.audit(...args),
}));
vi.mock("@/lib/billing/resolveSectionPlanMonthlyAmount", () => ({
  isStudentActivelyEnrolledInSection: (...args: unknown[]) => mocks.enrolled(...args),
  resolveSectionPlanMonthlyAmount: (...args: unknown[]) => mocks.plan(...args),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
  logServerError: vi.fn(),
}));

import { recordOnePaymentWithoutReceipt } from "@/lib/billing/recordPaymentWithoutReceiptCore";

const STUDENT = "00000000-0000-4000-8000-000000000001";
const SECTION = "00000000-0000-4000-8000-000000000002";

function supabase(payment: Record<string, unknown> | null, updateRows: { id: string }[] | null = null) {
  const writes: Array<{ table: string; op: string; values: unknown }> = [];
  function query(table: string) {
    const q = {
      select: () => q,
      eq: () => q,
      in: () => q,
      update: (values: unknown) => {
        writes.push({ table, op: "update", values });
        return q;
      },
      insert: (values: unknown) => {
        writes.push({ table, op: "insert", values });
        return q;
      },
      delete: () => q,
      maybeSingle: async () => ({ data: table === "payments" ? payment : { name: "A" }, error: null }),
      single: async () =>
        table === "profiles"
          ? { data: { role: "student" }, error: null }
          : { data: { id: "pay-1" }, error: null },
      then: (resolve: (value: { data?: { id: string }[]; error: null }) => void) =>
        resolve(
          table === "payments" && updateRows != null
            ? { data: updateRows, error: null }
            : { error: null },
        ),
    };
    return q;
  }
  return { client: { from: query }, writes };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.enrolled.mockResolvedValue(true);
  mocks.plan.mockResolvedValue({ code: "ok", amount: 10000, currency: "CLP" });
  mocks.audit.mockResolvedValue({ ok: true });
});

describe("recordOnePaymentWithoutReceipt", () => {
  it("stores the method and the date on a new approved row", async () => {
    const db = supabase(null);
    const result = await recordOnePaymentWithoutReceipt(db.client as never, {
      studentId: STUDENT,
      sectionId: SECTION,
      year: 2026,
      month: 3,
      adminNote: null,
      paymentMethod: "cash",
      paidOn: "2026-03-12",
      actorId: "admin-1",
      correlationId: null,
    });
    expect(result.success).toBe(true);
    expect(db.writes[0]).toMatchObject({
      table: "payments",
      op: "insert",
      values: { payment_method: "cash", paid_on: "2026-03-12", status: "approved" },
    });
  });

  it("fails when the cash update matches no row", async () => {
    const db = supabase(
      { id: "pay-1", status: "pending", amount: 10000, admin_notes: null },
      [],
    );
    const result = await recordOnePaymentWithoutReceipt(db.client as never, {
      studentId: STUDENT,
      sectionId: SECTION,
      year: 2026,
      month: 3,
      adminNote: null,
      paymentMethod: "cash",
      paidOn: "2026-03-12",
      actorId: "admin-1",
      correlationId: null,
    });
    expect(result).toEqual({ success: false, code: "save_failed", month: 3 });
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});
