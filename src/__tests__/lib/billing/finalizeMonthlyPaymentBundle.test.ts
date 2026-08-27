/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockPlan = vi.fn();
const mockUpsert = vi.fn();

vi.mock("@/lib/billing/resolveSectionPlanMonthlyAmount", () => ({
  resolveSectionPlanMonthlyAmount: (...a: unknown[]) => mockPlan(...a),
}));
vi.mock("@/lib/billing/upsertApprovedMonthlyPaymentCore", () => ({
  upsertApprovedMonthlyPaymentCore: (...a: unknown[]) => mockUpsert(...a),
}));

import { finalizeMonthlyPaymentBundle } from "@/lib/billing/finalizeMonthlyPaymentBundle";

const admin = {} as never;
const bundle = {
  studentId: "stu-1",
  parentId: "par-1",
  year: 2026,
  month: 5,
  sectionIds: ["sec-a", "sec-b"],
};

describe("finalizeMonthlyPaymentBundle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approves each section with its plan amount when the sum matches the gateway", async () => {
    mockPlan
      .mockResolvedValueOnce({ code: "ok", amount: 120, currency: "CLP" })
      .mockResolvedValueOnce({ code: "ok", amount: 90, currency: "CLP" });
    mockUpsert
      .mockResolvedValueOnce({
        ok: true,
        approved: true,
        paymentId: "p1",
        studentId: "stu-1",
        sectionId: "sec-a",
        month: 5,
        year: 2026,
        amount: 120,
        currency: "CLP",
        alreadyApproved: false,
      })
      .mockResolvedValueOnce({
        ok: true,
        approved: true,
        paymentId: "p2",
        studentId: "stu-1",
        sectionId: "sec-b",
        month: 5,
        year: 2026,
        amount: 90,
        currency: "CLP",
        alreadyApproved: false,
      });

    const r = await finalizeMonthlyPaymentBundle({
      admin,
      bundle,
      gatewayAmount: 210,
      gatewayCurrency: "CLP",
      gatewayProvider: "flow",
      source: "flow_cl",
    });

    expect(r).toEqual({ ok: true, approved: true, paymentId: "p1", paymentIds: ["p1", "p2"] });
    expect(mockUpsert.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        gatewayAmount: 120,
        slot: expect.objectContaining({ sectionId: "sec-a" }),
      }),
    );
    expect(mockUpsert.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        gatewayAmount: 90,
        slot: expect.objectContaining({ sectionId: "sec-b" }),
      }),
    );
  });

  it("skips materialization when the gateway total does not match the plan sum", async () => {
    mockPlan
      .mockResolvedValueOnce({ code: "ok", amount: 120, currency: "CLP" })
      .mockResolvedValueOnce({ code: "ok", amount: 90, currency: "CLP" });

    const r = await finalizeMonthlyPaymentBundle({
      admin,
      bundle,
      gatewayAmount: 999,
      gatewayCurrency: "CLP",
      gatewayProvider: "flow",
      source: "flow_cl",
    });

    expect(r).toEqual({ ok: true, skipped: "amount_mismatch" });
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
