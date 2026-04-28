"use client";

import { EnrollmentFeeMatrixChip } from "@/components/dashboard/EnrollmentFeeMatrixChip";
import { enrollmentFeeMatrixVisualFromSectionRow } from "@/lib/billing/enrollmentFeeMatrixVisual";
import { sectionCollectionsMatrixChipHoverFrame } from "@/lib/billing/sectionCollectionsMonthCellClasses";
import type {
  SectionCollectionsStudentRow,
  SectionCollectionsView,
} from "@/types/sectionCollections";

export interface SectionCollectionsEnrollmentFeeCellProps {
  student: SectionCollectionsStudentRow;
  view: SectionCollectionsView;
  /** Accessible name for the chip (includes student name + enrollment context). */
  ariaLabel: string;
}

/** Month “0” chip — enrollment fee status (aligned with monthly matrix styling). */
export function SectionCollectionsEnrollmentFeeCell({
  student,
  view,
  ariaLabel,
}: SectionCollectionsEnrollmentFeeCellProps) {
  const sectionCharges = (student.enrollmentFee?.amount ?? 0) > 0;
  const visual = enrollmentFeeMatrixVisualFromSectionRow(student.row, {
    sectionChargesEnrollmentFee: sectionCharges,
    sectionStartsOn: view.sectionStartsOn,
    enrolledAt: student.enrolledAt,
    todayYear: view.year,
    todayMonth: view.todayMonth,
  });
  if (!sectionCharges && visual == null) {
    return (
      <span className="text-[10px] text-[var(--color-muted-foreground)]" aria-hidden>
        —
      </span>
    );
  }
  return (
    <span className={`inline-flex ${sectionCollectionsMatrixChipHoverFrame}`}>
      <EnrollmentFeeMatrixChip ariaLabel={ariaLabel} visual={visual} />
    </span>
  );
}
