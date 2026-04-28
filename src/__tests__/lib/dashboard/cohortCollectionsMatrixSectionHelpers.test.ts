import { describe, expect, it } from "vitest";
import type { SectionCollectionsView } from "@/types/sectionCollections";
import {
  formatCohortCollectionsMoney,
  formatCohortCollectionsPercent,
  scholarshipDiscountForCohortMatrixPeriod,
  sectionBillingSummary,
  studentCellCurrency,
} from "@/lib/dashboard/cohortCollectionsMatrixSectionHelpers";

describe("cohortCollectionsMatrixSectionHelpers", () => {
  it("formats money and percent", () => {
    expect(formatCohortCollectionsMoney(1200, "es-ES", "EUR")).toMatch(/1/);
    expect(formatCohortCollectionsPercent(0.5, "en-US")).toMatch(/50/);
  });

  it("sectionBillingSummary falls back currency and fees", () => {
    const view = {
      students: [
        {
          row: {
            currentPlan: null,
            enrollmentFeeCurrency: "GBP",
            enrollmentFeeAmount: 50,
            cells: [],
          },
        },
      ],
    } as unknown as SectionCollectionsView;
    expect(sectionBillingSummary(view)).toEqual({
      monthlyFee: null,
      enrollmentFee: 50,
      currency: "GBP",
    });
  });

  it("studentCellCurrency scans cells", () => {
    expect(studentCellCurrency([{ currency: "MXN" } as never])).toBe("MXN");
    expect(studentCellCurrency([])).toBe("USD");
  });

  it("scholarshipDiscountForCohortMatrixPeriod returns null when zero", () => {
    const student = { scholarships: [] } as SectionCollectionsView["students"][number];
    expect(scholarshipDiscountForCohortMatrixPeriod(student, 2026, 1)).toBeNull();
  });
});
