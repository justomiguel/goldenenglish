import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  maybeRemoveAnnualSettlementIfFullyReverted,
  parseAnnualSettlementIdFromAdminNotes,
} from "@/lib/billing/annualSettlementCleanupAfterPaymentRevert";

const auditFinanceAction = vi.fn();
vi.mock("@/lib/audit", () => ({
  auditFinanceAction: (...a: unknown[]) => auditFinanceAction(...a),
}));

describe("parseAnnualSettlementIdFromAdminNotes", () => {
  it("returns null when notes missing tag", () => {
    expect(parseAnnualSettlementIdFromAdminNotes("plain")).toBeNull();
    expect(parseAnnualSettlementIdFromAdminNotes(null)).toBeNull();
  });

  it("parses uuid after annual_settlement:", () => {
    const id = "aabbccdd-eeff-0011-2233-445566778899";
    expect(parseAnnualSettlementIdFromAdminNotes(`note\nannual_settlement:${id}\nmore`)).toBe(id);
  });
});

describe("maybeRemoveAnnualSettlementIfFullyReverted", () => {
  beforeEach(() => {
    auditFinanceAction.mockReset();
    auditFinanceAction.mockResolvedValue({ ok: true });
  });

  it("no-ops when no settlement tag in previous notes", async () => {
    const from = vi.fn();
    const supabase = { from } as never;
    await maybeRemoveAnnualSettlementIfFullyReverted(supabase, {
      studentId: "s1",
      sectionId: "sec1",
      previousAdminNotes: "no tag",
      actorId: "a1",
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("deletes settlement and audits when no approved tagged payments remain", async () => {
    const sid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const enrollmentId = "11111111-2222-3333-4444-555555555555";

    const paymentsSelect = vi.fn().mockReturnValue({
      eq: () => ({
        eq: () => ({
          eq: () => ({
            like: () => Promise.resolve({ count: 0, error: null }),
          }),
        }),
      }),
    });

    const settlementsSelect = vi.fn().mockReturnValue({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({
            data: {
              id: sid,
              enrollment_id: enrollmentId,
              student_id: "stu",
              section_id: "sec",
              includes_enrollment_fee: false,
              coverage_from_year: 2026,
            },
            error: null,
          }),
      }),
    });

    const settlementsDelete = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ error: null }),
    });

    const from = vi.fn((table: string) => {
      if (table === "payments") {
        return { select: paymentsSelect };
      }
      if (table === "section_enrollment_annual_settlements") {
        return {
          select: settlementsSelect,
          delete: settlementsDelete,
        };
      }
      throw new Error(table);
    });

    await maybeRemoveAnnualSettlementIfFullyReverted({ from } as never, {
      studentId: "stu",
      sectionId: "sec",
      previousAdminNotes: `annual_settlement:${sid}`,
      actorId: "admin-1",
    });

    expect(settlementsDelete).toHaveBeenCalled();
    expect(auditFinanceAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "delete",
        resourceType: "annual_settlement",
        resourceId: sid,
      }),
    );
  });

  it("does not delete when other approved tagged payments exist", async () => {
    const sid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

    const paymentsSelect = vi.fn().mockReturnValue({
      eq: () => ({
        eq: () => ({
          eq: () => ({
            like: () => Promise.resolve({ count: 1, error: null }),
          }),
        }),
      }),
    });

    const from = vi.fn((table: string) => {
      if (table === "payments") return { select: paymentsSelect };
      throw new Error(table);
    });

    await maybeRemoveAnnualSettlementIfFullyReverted({ from } as never, {
      studentId: "stu",
      sectionId: "sec",
      previousAdminNotes: `annual_settlement:${sid}`,
      actorId: "admin-1",
    });

    expect(from).toHaveBeenCalledTimes(1);
    expect(auditFinanceAction).not.toHaveBeenCalled();
  });
});
