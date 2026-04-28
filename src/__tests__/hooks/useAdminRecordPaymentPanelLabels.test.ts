import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAdminRecordPaymentPanelLabels } from "@/hooks/useAdminRecordPaymentPanelLabels";
import type { Dictionary } from "@/types/i18n";

describe("useAdminRecordPaymentPanelLabels", () => {
  it("derives selectable months from monthStates", () => {
    const labels = {
      recordPaymentSelectAll: "all",
      recordPaymentClear: "clear",
      recordPaymentCountSelected: "n",
      recordPaymentGridHint: "hint",
      recordPaymentMatrixLegend: "leg",
      matrixLegendOpenButton: "open",
      matrixLegendModalTitle: "title",
      cancel: "cancel",
      recordPaymentMatrixLegendScholarshipSample: "sch",
      recordPaymentStatusPaid: "paid",
      recordPaymentStatusPending: "pend",
      recordPaymentStatusRejected: "rej",
      recordPaymentStatusExempt: "ex",
      recordPaymentStatusUnpaid: "un",
      recordPaymentStatusOverdue: "od",
      recordPaymentStatusNoPlan: "np",
      recordPaymentStatusOutOfPeriod: "oop",
      recordPaymentScholarshipBadge: "b",
      recordPaymentLegacyStatus: "l",
      recordPaymentMonthZeroColumnShort: "0",
      recordPaymentMonthZeroTooltip: "tip",
      recordPaymentEnrollmentColumnActivate: "{section}",
      recordPaymentEnrollmentFeeChipAria: "{name}",
    } as Dictionary["admin"]["billing"];

    const { result } = renderHook(() =>
      useAdminRecordPaymentPanelLabels({
        labels,
        sectionName: "A",
        studentName: "B",
        showEnrollmentMonthZero: false,
        enrollmentMonthZeroVisual: null,
        enrollmentFeeModalOpenSetter: vi.fn(),
        hasEnrollmentFeeModal: false,
        busy: false,
        monthStates: [
          { month: 1, selectable: true } as import("@/lib/billing/buildAdminBillingMonthGrid").AdminBillingMonthState,
          { month: 2, selectable: false } as import("@/lib/billing/buildAdminBillingMonthGrid").AdminBillingMonthState,
          { month: 3, selectable: true } as import("@/lib/billing/buildAdminBillingMonthGrid").AdminBillingMonthState,
        ],
      }),
    );

    expect(result.current.selectableMonths).toEqual([1, 3]);
    expect(result.current.enrollmentMonthZero).toBeNull();
  });

  it("builds enrollmentMonthZero when section charges enrollment fee", () => {
    const labels = {
      recordPaymentSelectAll: "all",
      recordPaymentClear: "clear",
      recordPaymentCountSelected: "n",
      recordPaymentGridHint: "hint",
      recordPaymentMatrixLegend: "leg",
      matrixLegendOpenButton: "open",
      matrixLegendModalTitle: "title",
      cancel: "cancel",
      recordPaymentMatrixLegendScholarshipSample: "sch",
      recordPaymentStatusPaid: "paid",
      recordPaymentStatusPending: "pend",
      recordPaymentStatusRejected: "rej",
      recordPaymentStatusExempt: "ex",
      recordPaymentStatusUnpaid: "un",
      recordPaymentStatusOverdue: "od",
      recordPaymentStatusNoPlan: "np",
      recordPaymentStatusOutOfPeriod: "oop",
      recordPaymentScholarshipBadge: "b",
      recordPaymentLegacyStatus: "l",
      recordPaymentMonthZeroColumnShort: "0",
      recordPaymentMonthZeroTooltip: "tip",
      recordPaymentEnrollmentColumnActivate: "{section}",
      recordPaymentEnrollmentFeeChipAria: "{name}",
    } as Dictionary["admin"]["billing"];
    const open = vi.fn();
    const { result } = renderHook(() =>
      useAdminRecordPaymentPanelLabels({
        labels,
        sectionName: "Sec",
        studentName: "Stu",
        showEnrollmentMonthZero: true,
        enrollmentMonthZeroVisual: { status: "pending", isOverdue: false },
        enrollmentFeeModalOpenSetter: open,
        hasEnrollmentFeeModal: true,
        busy: false,
        monthStates: [],
      }),
    );
    expect(result.current.enrollmentMonthZero?.onActivate).toBeDefined();
    result.current.enrollmentMonthZero?.onActivate?.();
    expect(open).toHaveBeenCalled();
  });
});
