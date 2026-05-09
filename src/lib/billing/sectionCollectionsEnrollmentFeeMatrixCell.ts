import { enrollmentFeeMatrixVisualFromSectionRow } from "@/lib/billing/enrollmentFeeMatrixVisual";
import { SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH } from "@/lib/billing/sectionCollectionsEnrollmentFeeCellMonth";
import type {
  SectionCollectionsStudentRow,
  SectionCollectionsView,
} from "@/types/sectionCollections";

/**
 * Whether the enrollment-fee column chip is clickable for bulk matrix actions
 * (same rule as showing a chip instead of "—").
 */
export function isSectionCollectionsEnrollmentFeeMatrixCellSelectable(
  student: SectionCollectionsStudentRow,
  view: Pick<SectionCollectionsView, "sectionStartsOn" | "year" | "todayMonth">,
  showEnrollmentFeeColumn: boolean,
): boolean {
  if (!showEnrollmentFeeColumn) return false;
  const sectionCharges = (student.enrollmentFee?.amount ?? 0) > 0;
  const visual = enrollmentFeeMatrixVisualFromSectionRow(student.row, {
    sectionChargesEnrollmentFee: sectionCharges,
    sectionStartsOn: view.sectionStartsOn,
    enrolledAt: student.enrolledAt,
    todayYear: view.year,
    todayMonth: view.todayMonth,
  });
  return !(visual == null && !sectionCharges);
}
