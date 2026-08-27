import { describe, expect, it } from "vitest";
import { discountedAverageMonthlyFeeFromCells } from "@/lib/billing/discountedAverageMonthlyFeeFromCells";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

function cell(
  month: number,
  status: StudentMonthlyPaymentCell["status"],
  extra: Partial<StudentMonthlyPaymentCell> = {},
): StudentMonthlyPaymentCell {
  return {
    month,
    year: 2026,
    status,
    expectedAmount: extra.expectedAmount ?? extra.fullMonthExpectedAmount ?? null,
    originalExpectedAmount: extra.originalExpectedAmount ?? extra.fullMonthOriginalExpectedAmount ?? null,
    scholarshipDiscountPercent: extra.scholarshipDiscountPercent ?? null,
    fullMonthExpectedAmount: extra.fullMonthExpectedAmount ?? null,
    fullMonthOriginalExpectedAmount: extra.fullMonthOriginalExpectedAmount ?? null,
    currency: extra.currency ?? "CLP",
    proration: extra.proration ?? null,
    recordedAmount: extra.recordedAmount ?? null,
    paymentId: extra.paymentId ?? null,
    receiptSignedUrl: extra.receiptSignedUrl ?? null,
    isCurrent: extra.isCurrent ?? false,
  };
}

function dueMonth(
  month: number,
  full: number,
  afterScholarship: number,
  percent: number | null = null,
): StudentMonthlyPaymentCell {
  return cell(month, afterScholarship <= 0 ? "exempt" : "due", {
    fullMonthOriginalExpectedAmount: full,
    fullMonthExpectedAmount: afterScholarship,
    scholarshipDiscountPercent: percent,
  });
}

describe("discountedAverageMonthlyFeeFromCells", () => {
  it("returns null when there are no cells", () => {
    expect(discountedAverageMonthlyFeeFromCells(null)).toBeNull();
    expect(discountedAverageMonthlyFeeFromCells(undefined)).toBeNull();
    expect(discountedAverageMonthlyFeeFromCells([])).toBeNull();
  });

  it("returns null when every month is blocked (no-plan / out-of-period)", () => {
    expect(
      discountedAverageMonthlyFeeFromCells([
        cell(1, "no-plan"),
        cell(2, "out-of-period"),
      ]),
    ).toBeNull();
  });

  it("returns null when billable months have no scholarship or exemption", () => {
    expect(
      discountedAverageMonthlyFeeFromCells([
        cell(1, "no-plan"),
        dueMonth(8, 30_000, 30_000),
        dueMonth(9, 30_000, 30_000),
      ]),
    ).toBeNull();
  });

  it("averages 50% scholarship across billable months and ignores blocked months", () => {
    expect(
      discountedAverageMonthlyFeeFromCells([
        cell(1, "no-plan"),
        cell(2, "no-plan"),
        dueMonth(8, 30_000, 15_000, 50),
        dueMonth(9, 30_000, 15_000, 50),
        dueMonth(10, 30_000, 15_000, 50),
        dueMonth(11, 30_000, 15_000, 50),
        dueMonth(12, 30_000, 15_000, 50),
      ]),
    ).toBe(15_000);
  });

  it("averages mixed discounts including full-price billable months", () => {
    expect(
      discountedAverageMonthlyFeeFromCells([
        dueMonth(8, 30_000, 15_000, 50),
        dueMonth(9, 30_000, 15_000, 50),
        dueMonth(10, 30_000, 30_000),
      ]),
    ).toBe(20_000);
  });

  it("returns 0 when every billable month is 100% scholarship", () => {
    expect(
      discountedAverageMonthlyFeeFromCells([
        dueMonth(8, 30_000, 0, 100),
        dueMonth(9, 30_000, 0, 100),
      ]),
    ).toBe(0);
  });

  it("returns 0 when every billable month is exempt", () => {
    expect(
      discountedAverageMonthlyFeeFromCells([
        cell(8, "exempt", {
          fullMonthOriginalExpectedAmount: 30_000,
          fullMonthExpectedAmount: 30_000,
        }),
        cell(9, "exempt", {
          fullMonthOriginalExpectedAmount: 30_000,
          fullMonthExpectedAmount: 30_000,
        }),
      ]),
    ).toBe(0);
  });

  it("counts exempt months as 0 in a mixed year", () => {
    expect(
      discountedAverageMonthlyFeeFromCells([
        cell(8, "exempt", {
          fullMonthOriginalExpectedAmount: 30_000,
          fullMonthExpectedAmount: 30_000,
        }),
        dueMonth(9, 30_000, 15_000, 50),
        dueMonth(10, 30_000, 15_000, 50),
      ]),
    ).toBe(10_000);
  });
});
