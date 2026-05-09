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
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (studentId: string) => void;
}

/** Month “0” chip — enrollment fee status (aligned with monthly matrix styling). */
export function SectionCollectionsEnrollmentFeeCell({
  student,
  view,
  ariaLabel,
  selectable = false,
  selected = false,
  onToggle,
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

  const selectedRing = selected
    ? "ring-2 ring-[var(--color-primary)] ring-offset-1"
    : "";
  const interactive = Boolean(selectable && onToggle && visual != null);
  const cursorClass = interactive ? "cursor-pointer" : "";

  if (!interactive) {
    return (
      <span className={`inline-flex ${sectionCollectionsMatrixChipHoverFrame}`}>
        <EnrollmentFeeMatrixChip ariaLabel={ariaLabel} visual={visual} />
      </span>
    );
  }

  return (
    <span className={`inline-flex ${sectionCollectionsMatrixChipHoverFrame}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-pressed={selected}
        title={ariaLabel}
        disabled={!selectable}
        onClick={() => onToggle?.(student.studentId)}
        className={`inline-flex h-8 min-w-[34px] flex-col items-center justify-center rounded border border-transparent bg-transparent p-0 transition-shadow disabled:cursor-default ${selectedRing} ${cursorClass}`}
      >
        <EnrollmentFeeMatrixChip ariaLabel={ariaLabel} visual={visual} decoratesParentButton />
      </button>
    </span>
  );
}
