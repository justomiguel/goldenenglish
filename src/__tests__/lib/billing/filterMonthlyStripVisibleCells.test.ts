import { describe, expect, it } from "vitest";
import {
  filterMonthlyStripVisibleCells,
  pickDefaultMonthlyStripFocusMonth,
} from "@/lib/billing/filterMonthlyStripVisibleCells";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

function cell(
  month: number,
  status: StudentMonthlyPaymentCell["status"],
  expected: number | null = 100,
): StudentMonthlyPaymentCell {
  return {
    month,
    year: 2026,
    status,
    expectedAmount: expected,
    currency: "CLP",
    proration: null,
    recordedAmount: null,
    paymentId: null,
    receiptSignedUrl: null,
    isCurrent: month === 5,
    fullMonthExpectedAmount: expected,
  };
}

const pwaOpts = { hideNonBillableMonths: true };
const parentOpts = { hideNonBillableMonths: true, hideSettledMonths: true };

describe("filterMonthlyStripVisibleCells", () => {
  it("hides non-billable months in PWA mode but keeps settled months", () => {
    const cells = [
      cell(1, "no-plan", null),
      cell(2, "out-of-period", null),
      cell(3, "approved"),
      cell(4, "due"),
    ];
    expect(filterMonthlyStripVisibleCells(cells, pwaOpts).map((c) => c.month)).toEqual([3, 4]);
  });

  it("parent mode shows all unsettled months including past overdue", () => {
    const cells = [
      cell(1, "no-plan", null),
      cell(2, "approved"),
      cell(3, "due"),
      cell(4, "rejected"),
      cell(5, "due"),
      cell(6, "due"),
      cell(7, "approved"),
    ];
    expect(filterMonthlyStripVisibleCells(cells, parentOpts).map((c) => c.month)).toEqual([
      3, 4, 5, 6,
    ]);
  });
});

describe("pickDefaultMonthlyStripFocusMonth", () => {
  it("prefers current visible month when settled months are shown", () => {
    const cells = [cell(1, "no-plan", null), cell(5, "due")];
    expect(pickDefaultMonthlyStripFocusMonth(cells, pwaOpts, 5)).toBe(5);
  });

  it("parent mode focuses oldest overdue unsettled month", () => {
    const cells = [
      cell(2, "approved"),
      cell(3, "due"),
      cell(4, "due"),
      cell(5, "due"),
    ];
    expect(pickDefaultMonthlyStripFocusMonth(cells, parentOpts, 5)).toBe(3);
  });
});
