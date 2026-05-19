import { describe, expect, it } from "vitest";
import { sortMonthlyPaymentSectionRows } from "@/lib/billing/sortMonthlyPaymentSectionRows";
import type { StudentMonthlyPaymentSectionRow } from "@/types/studentMonthlyPayments";

function row(id: string, settled: boolean): StudentMonthlyPaymentSectionRow {
  return {
    sectionId: id,
    sectionName: id,
    cohortName: null,
    hasActivePlan: true,
    enrollmentFeeAmount: 0,
    enrollmentFeeExempt: true,
    enrollmentFeeExemptReason: null,
    enrollmentFeeCurrency: "CLP",
    cells: [],
  };
}

describe("sortMonthlyPaymentSectionRows", () => {
  it("places unsettled sections before settled ones", () => {
    const sorted = sortMonthlyPaymentSectionRows(
      [row("paid", true), row("due", false), row("paid2", true)],
      (r) => r.sectionId.startsWith("paid"),
    );
    expect(sorted.map((r) => r.sectionId)).toEqual(["due", "paid", "paid2"]);
  });
});
