/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { planJoinBillingMonths } from "@/lib/billing/planJoinBillingMonths";

// REGRESSION CHECK: Changing prior-month bounds may mark mid-year joiners as overdue
// in collections (plan-year scope) or skip months they never attended.

describe("planJoinBillingMonths", () => {
  it("marks January–September as prior when the cycle starts in January and they join in October", () => {
    const plan = planJoinBillingMonths({
      sectionStartsOn: "2026-01-05",
      sectionEndsOn: "2026-12-20",
      joinYear: 2026,
      joinMonth: 10,
    });
    expect(plan.joinIsBillable).toBe(true);
    expect(plan.lastCycleMonth).toEqual({ year: 2026, month: 12 });
    expect(plan.priorMonths).toEqual([
      { year: 2026, month: 1 },
      { year: 2026, month: 2 },
      { year: 2026, month: 3 },
      { year: 2026, month: 4 },
      { year: 2026, month: 5 },
      { year: 2026, month: 6 },
      { year: 2026, month: 7 },
      { year: 2026, month: 8 },
      { year: 2026, month: 9 },
    ]);
  });

  it("has no prior months when they join in the section start month", () => {
    const plan = planJoinBillingMonths({
      sectionStartsOn: "2026-01-10",
      sectionEndsOn: "2026-12-01",
      joinYear: 2026,
      joinMonth: 1,
    });
    expect(plan.priorMonths).toEqual([]);
    expect(plan.joinIsBillable).toBe(true);
  });

  it("does not exempt backwards when they enroll before the section starts", () => {
    const plan = planJoinBillingMonths({
      sectionStartsOn: "2026-03-01",
      sectionEndsOn: "2026-12-15",
      joinYear: 2026,
      joinMonth: 2,
    });
    expect(plan.priorMonths).toEqual([]);
    expect(plan.joinIsBillable).toBe(false);
    expect(plan.lastCycleMonth).toEqual({ year: 2026, month: 12 });
  });

  it("walks prior months across a year boundary", () => {
    const plan = planJoinBillingMonths({
      sectionStartsOn: "2025-11-01",
      sectionEndsOn: "2026-06-30",
      joinYear: 2026,
      joinMonth: 2,
    });
    expect(plan.priorMonths).toEqual([
      { year: 2025, month: 11 },
      { year: 2025, month: 12 },
      { year: 2026, month: 1 },
    ]);
    expect(plan.lastCycleMonth).toEqual({ year: 2026, month: 6 });
    expect(plan.joinIsBillable).toBe(true);
  });

  it("uses December of the join year when ends_on is missing", () => {
    const plan = planJoinBillingMonths({
      sectionStartsOn: "2026-03-01",
      sectionEndsOn: null,
      joinYear: 2026,
      joinMonth: 6,
    });
    expect(plan.lastCycleMonth).toEqual({ year: 2026, month: 12 });
    expect(plan.priorMonths.map((m) => m.month)).toEqual([3, 4, 5]);
  });
});
