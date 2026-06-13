import { enrollmentFeeMatrixVisualFromSectionRow } from "@/lib/billing/enrollmentFeeMatrixVisual";
import { SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH } from "@/lib/billing/sectionCollectionsEnrollmentFeeCellMonth";
import type { SectionCollectionsStudentRow } from "@/types/sectionCollections";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

export type SectionCollectionsCellSelectionMode = "record" | "revert";

/** Monthly cell eligible for mark paid / scholarship / exempt bulk actions. */
export function isSectionCollectionsMonthlyCellRecordSelectable(
  cell: StudentMonthlyPaymentCell,
): boolean {
  return cell.status !== "approved" && cell.status !== "exempt";
}

/** Monthly cell eligible for revert-to-not-paid (staff-recorded approved payment). */
export function isSectionCollectionsMonthlyCellRevertSelectable(
  cell: StudentMonthlyPaymentCell,
): boolean {
  return cell.status === "approved" && cell.paymentId != null;
}

export function findSectionCollectionsMonthlyCell(
  student: SectionCollectionsStudentRow,
  year: number,
  month: number,
): StudentMonthlyPaymentCell | null {
  return student.row.cells.find((c) => c.month === month && c.year === year) ?? null;
}

export function sectionCollectionsCellRecordSelectable(
  student: SectionCollectionsStudentRow,
  year: number,
  month: number,
  showEnrollmentFeeColumn: boolean,
  sectionStartsOn: string,
  todayMonth: number,
): boolean {
  if (month === SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH) {
    if (!showEnrollmentFeeColumn) return false;
    const sectionCharges = (student.enrollmentFee?.amount ?? 0) > 0;
    const visual = enrollmentFeeMatrixVisualFromSectionRow(student.row, {
      sectionChargesEnrollmentFee: sectionCharges,
      sectionStartsOn,
      enrolledAt: student.enrolledAt,
      todayYear: year,
      todayMonth,
    });
    if (visual == null && !sectionCharges) return false;
    return visual != null && visual.status !== "approved" && visual.status !== "exempt";
  }
  const cell = findSectionCollectionsMonthlyCell(student, year, month);
  return cell != null && isSectionCollectionsMonthlyCellRecordSelectable(cell);
}

export function sectionCollectionsCellRevertSelectable(
  student: SectionCollectionsStudentRow,
  year: number,
  month: number,
): boolean {
  if (month === SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH) return false;
  const cell = findSectionCollectionsMonthlyCell(student, year, month);
  return cell != null && isSectionCollectionsMonthlyCellRevertSelectable(cell);
}

export function sectionCollectionsCellActionMode(
  student: SectionCollectionsStudentRow,
  year: number,
  month: number,
  showEnrollmentFeeColumn: boolean,
  sectionStartsOn: string,
  todayMonth: number,
): SectionCollectionsCellSelectionMode | null {
  if (
    sectionCollectionsCellRevertSelectable(student, year, month)
  ) {
    return "revert";
  }
  if (
    sectionCollectionsCellRecordSelectable(
      student,
      year,
      month,
      showEnrollmentFeeColumn,
      sectionStartsOn,
      todayMonth,
    )
  ) {
    return "record";
  }
  return null;
}
