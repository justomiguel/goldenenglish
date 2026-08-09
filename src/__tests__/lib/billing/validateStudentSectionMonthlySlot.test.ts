/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockEnrolled = vi.fn();
const mockPlan = vi.fn();
const mockAdvance = vi.fn();

vi.mock("@/lib/billing/resolveSectionPlanMonthlyAmount", () => ({
  isStudentActivelyEnrolledInSection: (...a: unknown[]) => mockEnrolled(...a),
  resolveSectionPlanMonthlyAmount: (...a: unknown[]) => mockPlan(...a),
}));
vi.mock("@/lib/billing/assertAdvanceMonthlyPaymentAllowed", () => ({
  assertAdvanceMonthlyPaymentAllowed: (...a: unknown[]) => mockAdvance(...a),
}));

import { validateStudentSectionMonthlySlot } from "@/lib/billing/validateStudentSectionMonthlySlot";

const supabase = {} as never;
const input = { studentId: "s1", sectionId: "sec1", month: 6, year: 2026 };

describe("validateStudentSectionMonthlySlot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns forbidden when the student is not actively enrolled", async () => {
    mockEnrolled.mockResolvedValue(false);
    const r = await validateStudentSectionMonthlySlot(supabase, input);
    expect(r).toEqual({ ok: false, reason: "forbidden" });
    expect(mockPlan).not.toHaveBeenCalled();
  });

  it("returns no_plan when there is no fee plan", async () => {
    mockEnrolled.mockResolvedValue(true);
    mockPlan.mockResolvedValue({ code: "no_plan" });
    const r = await validateStudentSectionMonthlySlot(supabase, input);
    expect(r).toEqual({ ok: false, reason: "no_plan" });
  });

  it("returns out_of_period when the month is outside the billing period", async () => {
    mockEnrolled.mockResolvedValue(true);
    mockPlan.mockResolvedValue({ code: "out_of_period" });
    const r = await validateStudentSectionMonthlySlot(supabase, input);
    expect(r).toEqual({ ok: false, reason: "out_of_period" });
  });

  // REGRESSION CHECK: this file now relies on `plan.code !== "ok"` forwarding the code as the reason.
  // A class-pack section must never reach the advance-window check or produce a charge, because its
  // money lives in `student_class_packs`, not in `payments`.
  it("refuses a section billed by class packs instead of charging a monthly fee", async () => {
    mockEnrolled.mockResolvedValue(true);
    mockPlan.mockResolvedValue({ code: "class_pack_section" });
    const r = await validateStudentSectionMonthlySlot(supabase, input);
    expect(r).toEqual({ ok: false, reason: "class_pack_section" });
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it("returns month_exempt when the effective amount is zero", async () => {
    mockEnrolled.mockResolvedValue(true);
    mockPlan.mockResolvedValue({ code: "ok", amount: 0, currency: "CLP" });
    const r = await validateStudentSectionMonthlySlot(supabase, input);
    expect(r).toEqual({ ok: false, reason: "month_exempt" });
  });

  it("returns future_month_not_allowed when advance window is closed", async () => {
    mockEnrolled.mockResolvedValue(true);
    mockPlan.mockResolvedValue({ code: "ok", amount: 50000, currency: "CLP" });
    mockAdvance.mockResolvedValue({ allowed: false });
    const r = await validateStudentSectionMonthlySlot(supabase, input);
    expect(r).toEqual({ ok: false, reason: "future_month_not_allowed" });
  });

  it("returns ok with the effective amount and currency when valid", async () => {
    mockEnrolled.mockResolvedValue(true);
    mockPlan.mockResolvedValue({ code: "ok", amount: 50000, currency: "CLP" });
    mockAdvance.mockResolvedValue({ allowed: true });
    const r = await validateStudentSectionMonthlySlot(supabase, input);
    expect(r).toEqual({ ok: true, effectiveAmount: 50000, currency: "CLP" });
  });
});
