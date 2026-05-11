import { describe, it, expect } from "vitest";
import { enrollmentFeeIsOverduePrimitives } from "@/lib/billing/enrollmentFeeDue";

describe("enrollmentFeeIsOverduePrimitives", () => {
  it("treats null enrolledAt as section start month", () => {
    const overdue = enrollmentFeeIsOverduePrimitives("2026-01-15", null, 2026, 3);
    expect(overdue).toBe(true);
  });

  it("falls back when enrolledAt ISO prefix is too short", () => {
    const overdue = enrollmentFeeIsOverduePrimitives("2026-01-15", "2026", 2026, 1);
    expect(overdue).toBe(false);
  });
});
