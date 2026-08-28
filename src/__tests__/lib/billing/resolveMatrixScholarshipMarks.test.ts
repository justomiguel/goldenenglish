import { describe, expect, it } from "vitest";
import { resolveMatrixScholarshipMarks } from "@/lib/billing/resolveMatrixScholarshipMarks";
import type { ScholarshipRow } from "@/lib/billing/scholarshipPeriod";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

function cell(
  month: number,
  status: StudentMonthlyPaymentCell["status"] = "due",
): Pick<StudentMonthlyPaymentCell, "month" | "year" | "status"> {
  return { month, year: 2026, status };
}

function inPeriodYear(): Pick<StudentMonthlyPaymentCell, "month" | "year" | "status">[] {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => cell(month));
}

function scholarship(
  over: Partial<ScholarshipRow> & Pick<ScholarshipRow, "discount_percent">,
): ScholarshipRow {
  return {
    is_active: true,
    valid_from_year: 2026,
    valid_from_month: 1,
    valid_until_year: null,
    valid_until_month: null,
    ...over,
  };
}

describe("resolveMatrixScholarshipMarks", () => {
  it("puts a uniform year scholarship on the name chip and not on month cells", () => {
    const marks = resolveMatrixScholarshipMarks({
      scholarships: [scholarship({ discount_percent: 50 })],
      year: 2026,
      cells: inPeriodYear(),
    });

    expect(marks.chipPercent).toBe(50);
    expect(marks.percentByMonth.every((p) => p == null)).toBe(true);
    expect(marks.hasParticularMonthMark).toBe(false);
  });

  it("ignores out-of-period months when deciding the year is uniform", () => {
    const cells = [
      cell(1, "out-of-period"),
      cell(2, "out-of-period"),
      ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => cell(month)),
    ];
    const marks = resolveMatrixScholarshipMarks({
      scholarships: [
        scholarship({
          discount_percent: 50,
          valid_from_month: 3,
        }),
      ],
      year: 2026,
      cells,
    });

    expect(marks.chipPercent).toBe(50);
    expect(marks.percentByMonth.every((p) => p == null)).toBe(true);
    expect(marks.hasParticularMonthMark).toBe(false);
  });

  it("marks only a particular month when the rest of the year has no scholarship", () => {
    const marks = resolveMatrixScholarshipMarks({
      scholarships: [
        scholarship({
          discount_percent: 50,
          valid_from_month: 5,
          valid_until_year: 2026,
          valid_until_month: 5,
        }),
      ],
      year: 2026,
      cells: inPeriodYear(),
    });

    expect(marks.chipPercent).toBeNull();
    expect(marks.percentByMonth[4]).toBe(50);
    expect(marks.percentByMonth.filter((p) => p != null)).toEqual([50]);
    expect(marks.hasParticularMonthMark).toBe(true);
  });

  it("keeps the common rate on the chip and marks only the month that differs", () => {
    const marks = resolveMatrixScholarshipMarks({
      scholarships: [
        scholarship({ discount_percent: 50 }),
        scholarship({
          discount_percent: 25,
          valid_from_month: 7,
          valid_until_year: 2026,
          valid_until_month: 7,
        }),
      ],
      year: 2026,
      cells: inPeriodYear(),
    });

    expect(marks.chipPercent).toBe(50);
    expect(marks.percentByMonth[6]).toBe(75);
    expect(marks.percentByMonth.filter((p) => p != null)).toEqual([75]);
    expect(marks.hasParticularMonthMark).toBe(true);
  });
});
