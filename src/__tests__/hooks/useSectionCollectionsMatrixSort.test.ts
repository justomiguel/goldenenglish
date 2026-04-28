import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSectionCollectionsMatrixSort } from "@/hooks/useSectionCollectionsMatrixSort";

const baseStudent = {
  studentId: "1",
  studentName: "Z A",
  documentLabel: null,
  row: {} as never,
  paid: 0,
  pendingReview: 0,
  overdue: 10,
  upcoming: 0,
  expectedYear: 0,
  hasOverdue: true,
  enrollmentFee: {
    amount: 0,
    expectedAmount: 0,
    exempt: true,
    exemptReason: null,
  },
  scholarships: [],
  activeScholarshipDiscountPercent: null,
  activePromotionLabel: null,
};

describe("useSectionCollectionsMatrixSort", () => {
  it("toggles sort direction on same column", () => {
    const students = [
      { ...baseStudent, studentId: "1", studentName: "B", overdue: 1 },
      { ...baseStudent, studentId: "2", studentName: "A", overdue: 2 },
    ];
    const { result } = renderHook(() => useSectionCollectionsMatrixSort(students));
    expect(result.current.sortedStudents.map((s) => s.studentName)).toEqual(["A", "B"]);
    act(() => {
      result.current.onToggleSort("student");
    });
    expect(result.current.sortDir).toBe("desc");
    expect(result.current.sortedStudents.map((s) => s.studentName)).toEqual(["B", "A"]);
  });

  it("sorts by totals column", () => {
    const students = [
      { ...baseStudent, studentId: "1", studentName: "A", overdue: 1, paid: 0 },
      { ...baseStudent, studentId: "2", studentName: "B", overdue: 2, paid: 100 },
    ];
    const { result } = renderHook(() => useSectionCollectionsMatrixSort(students));
    act(() => result.current.onToggleSort("totals"));
    expect(result.current.sortKey).toBe("totals");
    expect(result.current.sortedStudents[0]!.studentId).toBe("1");
    act(() => result.current.onToggleSort("totals"));
    expect(result.current.sortedStudents[0]!.studentId).toBe("2");
  });
});
