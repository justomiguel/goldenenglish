import { describe, expect, it } from "vitest";
import { buildSectionCollectionsOverdueCellSelection } from "@/lib/billing/buildSectionCollectionsOverdueCellSelection";
import { cellKey } from "@/lib/billing/sectionCollectionsCellSelectionKeys";
import type { SectionCollectionsStudentRow } from "@/types/sectionCollections";

function student(
  id: string,
  cells: SectionCollectionsStudentRow["row"]["cells"],
  enrollmentFee?: SectionCollectionsStudentRow["enrollmentFee"],
): SectionCollectionsStudentRow {
  return {
    studentId: id,
    displayName: id,
    enrolledAt: "2026-01-01",
    hasOverdue: true,
    enrollmentFee: enrollmentFee ?? null,
    row: { cells },
  };
}

describe("buildSectionCollectionsOverdueCellSelection", () => {
  it("selects overdue due cells before today", () => {
    const rows = [
      student("s1", [
        {
          month: 1,
          year: 2026,
          status: "due",
          expectedAmount: 100,
          fullMonthExpectedAmount: 100,
          currency: "USD",
          proration: null,
          recordedAmount: null,
          paymentId: null,
          receiptSignedUrl: null,
          isCurrent: false,
        },
        {
          month: 6,
          year: 2026,
          status: "due",
          expectedAmount: 100,
          fullMonthExpectedAmount: 100,
          currency: "USD",
          proration: null,
          recordedAmount: null,
          paymentId: null,
          receiptSignedUrl: null,
          isCurrent: false,
        },
      ]),
    ];

    const selected = buildSectionCollectionsOverdueCellSelection(rows, 2026, 3, "2026-01-01");
    expect(selected.has(cellKey("s1", 1))).toBe(true);
    expect(selected.has(cellKey("s1", 6))).toBe(false);
  });
});
