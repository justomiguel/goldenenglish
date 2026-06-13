import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useSectionCollectionsCellSelection,
  cellKey,
  parseCellKey,
} from "@/hooks/useSectionCollectionsCellSelection";
import type { SectionCollectionsStudentRow } from "@/types/sectionCollections";

function makeStudent(
  studentId: string,
  months: Array<{ month: number; status: "due" | "approved"; paymentId?: string | null }>,
): SectionCollectionsStudentRow {
  return {
    studentId,
    studentName: `Student ${studentId}`,
    documentLabel: null,
    enrolledAt: null,
    row: {
      sectionId: "sec-1",
      sectionName: "Section 1",
      cohortName: "Cohort 2026",
      hasActivePlan: true,
      enrollmentFeeAmount: 0,
      enrollmentFeeExempt: false,
      enrollmentFeeExemptReason: null,
      enrollmentFeeCurrency: "USD",
      cells: months.map(({ month, status, paymentId = null }) => ({
        month,
        year: 2026,
        status,
        expectedAmount: 100,
        fullMonthExpectedAmount: 100,
        currency: "USD",
        proration: null,
        recordedAmount: status === "approved" ? 100 : null,
        paymentId: paymentId ?? (status === "approved" ? `pay-${month}` : null),
        receiptSignedUrl: null,
        isCurrent: false,
      })),
      currentPlan: null,
      enrollmentId: "enr-1",
      enrollmentFeeReceiptStatus: null,
      enrollmentFeeReceiptSignedUrl: null,
      lastEnrollmentPaidAt: null,
    },
    paid: 0,
    pendingReview: 0,
    overdue: 0,
    upcoming: 0,
    expectedYear: 1200,
    hasOverdue: false,
    enrollmentFee: { amount: 0, expectedAmount: 0, exempt: false, exemptReason: null },
    scholarships: [],
    activeScholarshipDiscountPercent: null,
    activePromotionLabel: null,
  };
}

describe("useSectionCollectionsCellSelection", () => {
  describe("cellKey and parseCellKey", () => {
    it("creates and parses cell keys correctly", () => {
      const key = cellKey("student-1", 3);
      expect(key).toBe("student-1:3");
      const parsed = parseCellKey(key);
      expect(parsed.studentId).toBe("student-1");
      expect(parsed.month).toBe(3);
    });
  });

  describe("toggleCell", () => {
    it("adds a cell when toggling an unselected cell", () => {
      const { result } = renderHook(() => useSectionCollectionsCellSelection());
      act(() => {
        result.current.toggleCell("stu-1", 3);
      });
      expect(result.current.isCellSelected("stu-1", 3)).toBe(true);
      expect(result.current.selectionCount).toBe(1);
    });
    it("removes a cell when toggling a selected cell", () => {
      const { result } = renderHook(() => useSectionCollectionsCellSelection());
      act(() => {
        result.current.toggleCell("stu-1", 3);
      });
      act(() => {
        result.current.toggleCell("stu-1", 3);
      });
      expect(result.current.isCellSelected("stu-1", 3)).toBe(false);
      expect(result.current.selectionCount).toBe(0);
    });
  });

  describe("toggleStudentRow", () => {
    it("selects all months for a student when checked", () => {
      const { result } = renderHook(() => useSectionCollectionsCellSelection());
      act(() => {
        result.current.toggleStudentRow("stu-1", true, [1, 2, 3]);
      });
      expect(result.current.isCellSelected("stu-1", 1)).toBe(true);
      expect(result.current.isCellSelected("stu-1", 2)).toBe(true);
      expect(result.current.isCellSelected("stu-1", 3)).toBe(true);
      expect(result.current.selectionCount).toBe(3);
    });

    it("deselects all months for a student when unchecked", () => {
      const { result } = renderHook(() => useSectionCollectionsCellSelection());
      act(() => {
        result.current.toggleStudentRow("stu-1", true, [1, 2, 3]);
      });
      act(() => {
        result.current.toggleStudentRow("stu-1", false, [1, 2, 3]);
      });
      expect(result.current.selectionCount).toBe(0);
    });
  });

  describe("clearSelection", () => {
    it("clears all selected cells", () => {
      const { result } = renderHook(() => useSectionCollectionsCellSelection());
      act(() => {
        result.current.toggleCell("stu-1", 1);
        result.current.toggleCell("stu-2", 2);
      });
      expect(result.current.selectionCount).toBe(2);
      act(() => {
        result.current.clearSelection();
      });
      expect(result.current.selectionCount).toBe(0);
    });
  });

  describe("cellsGroupedByStudent", () => {
    it("groups selected cells by student", () => {
      const { result } = renderHook(() => useSectionCollectionsCellSelection());
      act(() => {
        result.current.toggleCell("stu-1", 1);
        result.current.toggleCell("stu-1", 3);
        result.current.toggleCell("stu-2", 2);
      });
      const grouped = result.current.cellsGroupedByStudent;
      expect(grouped.get("stu-1")).toEqual([1, 3]);
      expect(grouped.get("stu-2")).toEqual([2]);
    });
  });

  describe("isStudentFullySelected", () => {
    it("returns true when all available months are selected", () => {
      const { result } = renderHook(() => useSectionCollectionsCellSelection());
      act(() => {
        result.current.toggleStudentRow("stu-1", true, [1, 2, 3]);
      });
      expect(result.current.isStudentFullySelected("stu-1", [1, 2, 3])).toBe(true);
    });

    it("returns false when not all months are selected", () => {
      const { result } = renderHook(() => useSectionCollectionsCellSelection());
      act(() => {
        result.current.toggleCell("stu-1", 1);
      });
      expect(result.current.isStudentFullySelected("stu-1", [1, 2, 3])).toBe(false);
    });
  });

  describe("selectAllOverdue", () => {
    it("selects only overdue cells", () => {
      const students: SectionCollectionsStudentRow[] = [
        makeStudent("stu-1", [
          { month: 1, status: "due" },
          { month: 2, status: "due" },
          { month: 3, status: "due" },
        ]),
        makeStudent("stu-2", [
          { month: 4, status: "due" },
          { month: 5, status: "due" },
          { month: 6, status: "due" },
        ]),
      ];
      const { result } = renderHook(() => useSectionCollectionsCellSelection());
      act(() => {
        result.current.selectAllOverdue(students, 2026, 4, "2026-01-01");
      });
      expect(result.current.isCellSelected("stu-1", 1)).toBe(true);
      expect(result.current.isCellSelected("stu-1", 2)).toBe(true);
      expect(result.current.isCellSelected("stu-1", 3)).toBe(true);
      expect(result.current.isCellSelected("stu-2", 4)).toBe(false);
    });
  });

  describe("selectionMode", () => {
    it("uses revert mode for paid cells and resets when mixing with due cells", () => {
      const students = [
        makeStudent("stu-1", [
          { month: 3, status: "due" },
          { month: 5, status: "approved" },
        ]),
      ];
      const context = {
        students,
        year: 2026,
        sectionStartsOn: "2026-01-01",
        todayMonth: 6,
        showEnrollmentFeeColumn: false,
      };
      const { result } = renderHook(() => useSectionCollectionsCellSelection(context));
      act(() => {
        result.current.toggleCell("stu-1", 5);
      });
      expect(result.current.selectionMode).toBe("revert");
      act(() => {
        result.current.toggleCell("stu-1", 3);
      });
      expect(result.current.selectionMode).toBe("record");
      expect(result.current.isCellSelected("stu-1", 5)).toBe(false);
    });
  });
});
