import { describe, expect, it } from "vitest";
import {
  resolveEnrollmentFeeChipStatus,
  sectionShowsEnrollmentFeeChip,
} from "@/lib/billing/resolveEnrollmentFeeChipStatus";
import type { StudentMonthlyPaymentSectionRow } from "@/types/studentMonthlyPayments";

function baseRow(
  patch: Partial<StudentMonthlyPaymentSectionRow> = {},
): StudentMonthlyPaymentSectionRow {
  return {
    sectionId: "s1",
    sectionName: "A",
    cohortName: null,
    hasActivePlan: true,
    enrollmentFeeAmount: 100,
    enrollmentFeeExempt: false,
    enrollmentFeeExemptReason: null,
    enrollmentFeeCurrency: "CLP",
    cells: [],
    currentPlan: null,
    enrollmentId: "enr-1",
    enrollmentFeeReceiptStatus: null,
    enrollmentFeeReceiptSignedUrl: null,
    lastEnrollmentPaidAt: null,
    allowAdvanceMonthlyPayment: false,
    ...patch,
  };
}

describe("resolveEnrollmentFeeChipStatus", () => {
  it("shows chip for exempt or billable enrollment", () => {
    expect(sectionShowsEnrollmentFeeChip(baseRow({ enrollmentFeeExempt: true }))).toBe(true);
    expect(sectionShowsEnrollmentFeeChip(baseRow({ enrollmentFeeAmount: 0 }))).toBe(false);
  });

  it("maps receipt states", () => {
    expect(resolveEnrollmentFeeChipStatus(baseRow({ enrollmentFeeExempt: true }))).toBe("exempt");
    expect(resolveEnrollmentFeeChipStatus(baseRow({ enrollmentFeeReceiptStatus: "pending" }))).toBe(
      "pending",
    );
    expect(resolveEnrollmentFeeChipStatus(baseRow({ lastEnrollmentPaidAt: "2026-01-01" }))).toBe(
      "approved",
    );
    expect(resolveEnrollmentFeeChipStatus(baseRow())).toBe("due");
  });
});
