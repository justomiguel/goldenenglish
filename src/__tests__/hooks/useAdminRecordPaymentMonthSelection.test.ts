import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAdminRecordPaymentMonthSelection } from "@/hooks/useAdminRecordPaymentMonthSelection";
import type { AdminBillingMonthState } from "@/lib/billing/buildAdminBillingMonthGrid";

const paid = (m: number): AdminBillingMonthState => ({
  month: m,
  status: "paid",
  paymentId: "p",
  recordedAmount: 1,
  scholarshipPercent: null,
  selectable: false,
  revertSelectable: true,
  legacyFallback: false,
});

const unpaid = (m: number): AdminBillingMonthState => ({
  month: m,
  status: "unpaid",
  paymentId: null,
  recordedAmount: null,
  scholarshipPercent: null,
  selectable: true,
  revertSelectable: false,
  legacyFallback: false,
});

describe("useAdminRecordPaymentMonthSelection", () => {
  it("switching mode replaces selection when mixing paid and unpaid picks", () => {
    const { result } = renderHook(() =>
      useAdminRecordPaymentMonthSelection([paid(3), unpaid(4)]),
    );
    act(() => {
      result.current.toggleMonth(4, true);
    });
    expect(result.current.selectionMode).toBe("record");
    expect(result.current.selected.has(4)).toBe(true);

    act(() => {
      result.current.toggleMonth(3, true);
    });
    expect(result.current.selectionMode).toBe("revert");
    expect(result.current.selected).toEqual(new Set([3]));

    act(() => {
      result.current.toggleMonth(4, true);
    });
    expect(result.current.selectionMode).toBe("record");
    expect(result.current.selected).toEqual(new Set([4]));
  });
});
