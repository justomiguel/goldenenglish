/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { applyJoinBillingDisposition } from "@/lib/billing/applyJoinBillingDisposition";
import type { JoinBillingDispositionPort } from "@/lib/billing/applyJoinBillingDisposition";

const SECTION = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const STUDENT = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function memoryPort(init?: {
  startsOn?: string | null;
  endsOn?: string | null;
  billingMode?: string;
  enrollmentFeeAmount?: number | null;
  enrollmentFeeExempt?: boolean;
  lastEnrollmentPaidAt?: string | null;
  payments?: Array<{ year: number; month: number; status: string }>;
  scholarships?: Array<{
    discount_percent: number;
    valid_from_year: number;
    valid_from_month: number;
    valid_until_year: number | null;
    valid_until_month: number | null;
    is_active: boolean;
  }>;
}): JoinBillingDispositionPort & {
  exempts: Array<{ year: number; month: number }>;
  approved: Array<{ year: number; month: number }>;
  scholarshipsInserted: number;
  stampedPaid: boolean;
} {
  const exempts: Array<{ year: number; month: number }> = [];
  const approved: Array<{ year: number; month: number }> = [];
  let scholarshipsInserted = 0;
  let stampedPaid = false;
  const payments = [...(init?.payments ?? [])];
  return {
    exempts,
    approved,
    get scholarshipsInserted() {
      return scholarshipsInserted;
    },
    get stampedPaid() {
      return stampedPaid;
    },
    async loadSectionFacts(_studentId, sectionIds) {
      return sectionIds.map((sectionId) => ({
        sectionId,
        startsOn: init?.startsOn ?? "2026-01-01",
        endsOn: init?.endsOn ?? "2026-12-31",
        billingMode: init?.billingMode ?? "section_monthly_fee",
        enrollmentFeeAmount: init?.enrollmentFeeAmount ?? 50000,
        enrollmentFeeExempt: init?.enrollmentFeeExempt ?? false,
        lastEnrollmentPaidAt: init?.lastEnrollmentPaidAt ?? null,
        enrollmentId: "enr-1",
      }));
    },
    async loadPayments() {
      return payments;
    },
    async insertExempt(row) {
      exempts.push({ year: row.year, month: row.month });
      payments.push({ year: row.year, month: row.month, status: "exempt" });
      return { ok: true };
    },
    async recordApprovedJoinMonth(row) {
      approved.push({ year: row.year, month: row.month });
      payments.push({ year: row.year, month: row.month, status: "approved" });
      return { ok: true };
    },
    async loadScholarships() {
      return init?.scholarships ?? [];
    },
    async insertScholarship() {
      scholarshipsInserted += 1;
      return { ok: true };
    },
    async stampEnrollmentPaid() {
      stampedPaid = true;
      return { ok: true };
    },
  };
}

// REGRESSION CHECK: A mid-year join without prior exempts shows as overdue on
// the admin collections matrix (plan-year). Do not skip the exempt loop.

describe("applyJoinBillingDisposition", () => {
  const now = new Date("2026-10-15T12:00:00.000Z");

  it("exempts prior months and marks the join month paid for current", async () => {
    const port = memoryPort();
    const result = await applyJoinBillingDisposition(port, {
      studentId: STUDENT,
      sectionIds: [SECTION],
      disposition: { kind: "current" },
      actorId: "admin-1",
      now,
    });
    expect(result).toEqual({ ok: true });
    expect(port.exempts.map((r) => r.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(port.approved).toEqual([{ year: 2026, month: 10 }]);
    expect(port.stampedPaid).toBe(true);
  });

  it("leaves the join month owed for behind and does not stamp matrícula", async () => {
    const port = memoryPort();
    const result = await applyJoinBillingDisposition(port, {
      studentId: STUDENT,
      sectionIds: [SECTION],
      disposition: { kind: "behind" },
      actorId: "admin-1",
      now,
    });
    expect(result).toEqual({ ok: true });
    expect(port.exempts).toHaveLength(9);
    expect(port.approved).toEqual([]);
    expect(port.stampedPaid).toBe(false);
  });

  it("creates a rest-of-cycle scholarship and still exempts prior months", async () => {
    const port = memoryPort();
    const insertScholarship = vi.fn(async () => {
      return { ok: true as const };
    });
    const wrapped: JoinBillingDispositionPort = {
      ...port,
      insertScholarship: async (input) => {
        await insertScholarship(input);
        return { ok: true };
      },
    };
    const result = await applyJoinBillingDisposition(wrapped, {
      studentId: STUDENT,
      sectionIds: [SECTION],
      disposition: { kind: "scholarship", percent: 100, scope: "rest_of_cycle" },
      actorId: "admin-1",
      now,
    });
    expect(result).toEqual({ ok: true });
    expect(port.exempts).toHaveLength(9);
    expect(insertScholarship).toHaveBeenCalledWith(
      expect.objectContaining({
        percent: 100,
        validFromYear: 2026,
        validFromMonth: 10,
        validUntilYear: 2026,
        validUntilMonth: 12,
      }),
    );
  });

  it("skips monthly writes for class-pack sections", async () => {
    const port = memoryPort({ billingMode: "class_pack" });
    const result = await applyJoinBillingDisposition(port, {
      studentId: STUDENT,
      sectionIds: [SECTION],
      disposition: { kind: "current" },
      actorId: "admin-1",
      now,
    });
    expect(result).toEqual({ ok: true });
    expect(port.exempts).toEqual([]);
    expect(port.approved).toEqual([]);
    expect(port.stampedPaid).toBe(true);
  });

  it("does not overwrite an approved join-month payment", async () => {
    const port = memoryPort({
      payments: [{ year: 2026, month: 10, status: "approved" }],
    });
    const result = await applyJoinBillingDisposition(port, {
      studentId: STUDENT,
      sectionIds: [SECTION],
      disposition: { kind: "current" },
      actorId: "admin-1",
      now,
    });
    expect(result).toEqual({ ok: true });
    expect(port.approved).toEqual([]);
    expect(port.exempts).toHaveLength(9);
  });

  it("does not insert a scholarship when one already covers the join month", async () => {
    const port = memoryPort({
      scholarships: [
        {
          discount_percent: 50,
          valid_from_year: 2026,
          valid_from_month: 10,
          valid_until_year: 2026,
          valid_until_month: 12,
          is_active: true,
        },
      ],
    });
    const result = await applyJoinBillingDisposition(port, {
      studentId: STUDENT,
      sectionIds: [SECTION],
      disposition: { kind: "scholarship", percent: 50, scope: "join_month" },
      actorId: "admin-1",
      now,
    });
    expect(result).toEqual({ ok: true });
    expect(port.scholarshipsInserted).toBe(0);
  });
});
