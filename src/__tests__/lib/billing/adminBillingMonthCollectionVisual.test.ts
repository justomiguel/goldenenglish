import { describe, expect, it } from "vitest";
import {
  adminMonthStateToCollectionVisual,
  resolveAdminBillingMonthChipVisual,
} from "@/lib/billing/adminBillingMonthCollectionVisual";
import type { AdminBillingMonthState } from "@/lib/billing/buildAdminBillingMonthGrid";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

describe("resolveAdminBillingMonthChipVisual", () => {
  const mkCell = (
    month: number,
    status: StudentMonthlyPaymentCell["status"],
    extra: Partial<StudentMonthlyPaymentCell> = {},
  ): StudentMonthlyPaymentCell => ({
    month,
    year: 2026,
    status,
    expectedAmount: null,
    originalExpectedAmount: null,
    scholarshipDiscountPercent: null,
    fullMonthExpectedAmount: null,
    fullMonthOriginalExpectedAmount: null,
    currency: null,
    proration: null,
    recordedAmount: null,
    paymentId: null,
    receiptSignedUrl: null,
    isCurrent: false,
    ...extra,
  });

  const baseState = (over: Partial<AdminBillingMonthState>): AdminBillingMonthState => ({
    month: 1,
    status: "unpaid",
    paymentId: null,
    recordedAmount: null,
    scholarshipPercent: null,
    selectable: false,
    revertSelectable: false,
    legacyFallback: false,
    ...over,
  });

  it("uses legacy-only semantics when legacyFallback is set", () => {
    const vis = resolveAdminBillingMonthChipVisual(
      baseState({ legacyFallback: true, month: 3 }),
      { status: "no-plan", month: 3, year: 2026 } as StudentMonthlyPaymentCell,
      2026,
      2026,
      4,
    );
    expect(vis.status).toBe("due");
    expect(vis.isOverdue).toBe(true);
  });

  it("uses cobranzas cell due when DB month is pending but no receipt is uploaded", () => {
    const vis = resolveAdminBillingMonthChipVisual(
      baseState({ month: 1, status: "pending", selectable: false }),
      mkCell(1, "due"),
      2026,
      2026,
      6,
    );
    expect(vis.status).toBe("due");
    expect(vis.isOverdue).toBe(true);
  });

  it("shows pending when cobranzas cell is pending-with-receipt", () => {
    const vis = resolveAdminBillingMonthChipVisual(
      baseState({ month: 2, status: "pending" }),
      mkCell(2, "pending", { receiptSignedUrl: "https://example.com/r.pdf" }),
      2026,
      2026,
      6,
    );
    expect(vis.status).toBe("pending");
    expect(vis.isOverdue).toBe(false);
  });

  it("shows padlock (no-plan) instead of overdue when finance marks no plan", () => {
    const cell = {
      month: 1,
      year: 2026,
      status: "no-plan",
      expectedAmount: null,
      originalExpectedAmount: null,
      scholarshipDiscountPercent: null,
      fullMonthExpectedAmount: null,
      fullMonthOriginalExpectedAmount: null,
      currency: null,
      proration: null,
      recordedAmount: null,
      paymentId: null,
      receiptSignedUrl: null,
      isCurrent: false,
    } satisfies StudentMonthlyPaymentCell;

    const vis = resolveAdminBillingMonthChipVisual(
      baseState({ month: 1, status: "unpaid", selectable: false }),
      cell,
      2026,
      2026,
      6,
    );
    expect(vis.status).toBe("no-plan");
    expect(vis.isOverdue).toBe(false);
  });
});

describe("adminMonthStateToCollectionVisual (baseline)", () => {
  it("marks unpaid past months overdue vs today", () => {
    const vis = adminMonthStateToCollectionVisual(
      {
        month: 1,
        status: "unpaid",
        paymentId: null,
        recordedAmount: null,
        scholarshipPercent: null,
        selectable: true,
        legacyFallback: false,
      },
      2026,
      2026,
      6,
    );
    expect(vis.status).toBe("due");
    expect(vis.isOverdue).toBe(true);
  });
});
