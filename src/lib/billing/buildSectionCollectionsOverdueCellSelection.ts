import { enrollmentFeeMatrixVisualFromSectionRow } from "@/lib/billing/enrollmentFeeMatrixVisual";
import { SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH } from "@/lib/billing/sectionCollectionsEnrollmentFeeCellMonth";
import { sectionCollectionsCellRecordSelectable } from "@/lib/billing/sectionCollectionsCellActionability";
import {
  cellKey,
  type CellKey,
} from "@/lib/billing/sectionCollectionsCellSelectionKeys";
import type { SectionCollectionsStudentRow } from "@/types/sectionCollections";

export function buildSectionCollectionsOverdueCellSelection(
  students: SectionCollectionsStudentRow[],
  year: number,
  todayMonth: number,
  sectionStartsOn: string,
): Set<CellKey> {
  const todayIdx = year * 12 + todayMonth;
  const showEnrollment = students.some((s) => (s.enrollmentFee?.amount ?? 0) > 0);
  const next = new Set<CellKey>();

  for (const s of students) {
    for (const cell of s.row.cells) {
      const cellIdx = cell.year * 12 + cell.month;
      const isOverdue = cell.status === "due" && cellIdx < todayIdx;
      if (
        isOverdue &&
        sectionCollectionsCellRecordSelectable(s, year, cell.month, false, sectionStartsOn, todayMonth)
      ) {
        next.add(cellKey(s.studentId, cell.month));
      }
    }
    if (showEnrollment) {
      const sectionCharges = (s.enrollmentFee?.amount ?? 0) > 0;
      const visual = enrollmentFeeMatrixVisualFromSectionRow(s.row, {
        sectionChargesEnrollmentFee: sectionCharges,
        sectionStartsOn,
        enrolledAt: s.enrolledAt,
        todayYear: year,
        todayMonth,
      });
      if (visual?.status === "due" && visual.isOverdue) {
        next.add(cellKey(s.studentId, SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH));
      }
    }
  }

  return next;
}
