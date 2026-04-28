import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/lib/dashboard/adminRecordPaymentBulkRunners", () => ({
  runRecordPaymentPaidBulk: vi.fn(),
  runRecordPaymentExemptBulk: vi.fn(),
  runRecordPaymentScholarshipBulk: vi.fn(),
}));

import { useAdminRecordPaymentBulkConfirm } from "@/hooks/useAdminRecordPaymentBulkConfirm";
import type { Dictionary } from "@/types/i18n";
import * as runners from "@/lib/dashboard/adminRecordPaymentBulkRunners";

function minimalBillingLabels(
  overrides: Partial<Dictionary["admin"]["billing"]> = {},
): Dictionary["admin"]["billing"] {
  return {
    recordPaymentBulkConfirmTitle: "paid {count}",
    recordPaymentScholarshipConfirmTitle: "sch {count}",
    recordPaymentExemptConfirmTitle: "ex {count}",
    recordPaymentBulkConfirmBody: "b1",
    recordPaymentScholarshipConfirmBody: "b2",
    recordPaymentExemptConfirmBody: "b3",
    ...overrides,
  } as Dictionary["admin"]["billing"];
}

describe("useAdminRecordPaymentBulkConfirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes confirm copy for paid pending action", () => {
    const noop = () => {};
    const { result } = renderHook(() =>
      useAdminRecordPaymentBulkConfirm({
        locale: "es",
        studentId: "a",
        sectionId: "b",
        year: 2026,
        labels: minimalBillingLabels(),
        selected: new Set([1]),
        pendingAction: "paid",
        scholarshipConfirmReady: false,
        exemptConfirmReady: false,
        modalAdminNote: "",
        modalScholarshipPercent: "",
        setBusy: noop,
        setMsg: noop,
        setSelected: noop,
        setPendingAction: noop,
        resetModalFields: noop,
        nSelected: 2,
      }),
    );
    expect(result.current.confirmTitle).toBe("paid 2");
    expect(result.current.confirmDescription).toBe("b1");
    expect(result.current.confirmHidden).toBe(false);
  });

  it("hides confirm for scholarship until percent valid", () => {
    const noop = () => {};
    const { result } = renderHook(() =>
      useAdminRecordPaymentBulkConfirm({
        locale: "es",
        studentId: "a",
        sectionId: "b",
        year: 2026,
        labels: minimalBillingLabels(),
        selected: new Set([1]),
        pendingAction: "scholarship",
        scholarshipConfirmReady: false,
        exemptConfirmReady: true,
        modalAdminNote: "",
        modalScholarshipPercent: "0",
        setBusy: noop,
        setMsg: noop,
        setSelected: noop,
        setPendingAction: noop,
        resetModalFields: noop,
        nSelected: 1,
      }),
    );
    expect(result.current.confirmHidden).toBe(true);
  });

  it("onConfirm calls runner and refresh on paid success", async () => {
    vi.mocked(runners.runRecordPaymentPaidBulk).mockResolvedValueOnce({
      ok: true,
      message: "saved",
    });
    const setBusy = vi.fn();
    const setMsg = vi.fn();
    const setSelected = vi.fn();
    const setPending = vi.fn();
    const reset = vi.fn();
    const { result } = renderHook(() =>
      useAdminRecordPaymentBulkConfirm({
        locale: "es",
        studentId: "a",
        sectionId: "b",
        year: 2026,
        labels: minimalBillingLabels(),
        selected: new Set([2]),
        pendingAction: "paid",
        scholarshipConfirmReady: true,
        exemptConfirmReady: true,
        modalAdminNote: "",
        modalScholarshipPercent: "",
        setBusy,
        setMsg,
        setSelected,
        setPendingAction: setPending,
        resetModalFields: reset,
        nSelected: 1,
      }),
    );
    await act(async () => {
      await result.current.onConfirm();
    });
    expect(runners.runRecordPaymentPaidBulk).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
    expect(setMsg).toHaveBeenCalledWith("saved");
  });
});
