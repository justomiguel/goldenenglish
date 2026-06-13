"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type {
  SectionCollectionsView,
  SectionCollectionsStudentRow,
} from "@/types/sectionCollections";
import type { Dictionary } from "@/types/i18n";
import { effectiveScholarshipPercentForPeriod } from "@/lib/billing/scholarshipPeriod";
import { isSectionCollectionsEnrollmentFeeMatrixCellSelectable } from "@/lib/billing/sectionCollectionsEnrollmentFeeMatrixCell";
import { SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH } from "@/lib/billing/sectionCollectionsEnrollmentFeeCellMonth";
import { SectionCollectionsEnrollmentFeeCell } from "./SectionCollectionsEnrollmentFeeCell";
import { SectionCollectionsMonthCell } from "./SectionCollectionsMonthCell";
import { SectionCollectionsStudentBenefits } from "./SectionCollectionsStudentBenefits";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function scholarshipDiscountForPeriod(
  student: SectionCollectionsStudentRow,
  year: number,
  month: number,
): number | null {
  const percent = effectiveScholarshipPercentForPeriod(student.scholarships, year, month);
  return percent > 0 ? percent : null;
}

export interface SectionCollectionsMatrixStudentRowProps {
  student: SectionCollectionsStudentRow;
  view: SectionCollectionsView;
  dict: CollectionsDict;
  selected: boolean;
  onToggle: (id: string, next: boolean) => void;
  money: Intl.NumberFormat;
  locale: string;
  showEnrollmentFeeColumn: boolean;
  cellSelectable?: boolean;
  isCellSelected?: (month: number) => boolean;
  isCellSelectable?: (month: number) => boolean;
  onToggleCell?: (studentId: string, month: number) => void;
  /** System-wide billing currency from Finance > Settings. */
  currency?: string;
}

export function SectionCollectionsMatrixStudentRow({
  student,
  view,
  dict,
  selected,
  onToggle,
  money,
  locale,
  showEnrollmentFeeColumn,
  cellSelectable = false,
  isCellSelected,
  isCellSelectable,
  onToggleCell,
  currency,
}: SectionCollectionsMatrixStudentRowProps) {
  const cells = MONTHS.map((m) =>
    student.row.cells.find((c) => c.month === m && c.year === view.year),
  );

  const enrollmentMatrixSelectable =
    cellSelectable &&
    showEnrollmentFeeColumn &&
    isSectionCollectionsEnrollmentFeeMatrixCellSelectable(student, view, showEnrollmentFeeColumn) &&
    (isCellSelectable?.(SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH) ?? true);

  const handleToggleCell = (month: number) => {
    onToggleCell?.(student.studentId, month);
  };

  return (
    <tr
      className={`border-b border-[var(--color-border)] last:border-b-0 ${student.hasOverdue ? "bg-[var(--color-error)]/5" : ""}`}
    >
      <td className="px-3 py-2 align-middle">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onToggle(student.studentId, e.target.checked)}
          aria-label={dict.matrix.selectStudentAria.replace(
            "{name}",
            student.studentName,
          )}
          className="h-4 w-4 cursor-pointer accent-[var(--color-primary)]"
        />
      </td>
      <td className="px-3 py-2 align-middle">
        <Link
          href={`/${locale}/dashboard/admin/users/${student.studentId}/billing`}
          className="group inline-flex max-w-full items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
          aria-label={dict.matrix.openStudentBillingAria.replace(
            "{name}",
            student.studentName,
          )}
        >
          <span className="truncate">{student.studentName}</span>
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 opacity-70 transition group-hover:opacity-100"
            aria-hidden
          />
        </Link>
        {student.documentLabel ? (
          <div className="text-[11px] text-[var(--color-muted-foreground)]">
            {student.documentLabel}
          </div>
        ) : null}
        <SectionCollectionsStudentBenefits
          student={student}
          labels={dict.benefits}
          locale={locale}
        />
      </td>
      {showEnrollmentFeeColumn ? (
        <td className="px-1 py-1 text-center align-middle">
          <SectionCollectionsEnrollmentFeeCell
            student={student}
            view={view}
            ariaLabel={dict.matrix.enrollmentFeeChipAria.replace(
              "{name}",
              student.studentName,
            )}
            selectable={enrollmentMatrixSelectable}
            selected={isCellSelected?.(0) ?? false}
            onToggle={
              enrollmentMatrixSelectable && onToggleCell
                ? (sid) => onToggleCell(sid, 0)
                : undefined
            }
          />
        </td>
      ) : null}
      {cells.map((cell, idx) => (
        <td key={MONTHS[idx]} className="px-1 py-1 text-center align-middle">
          {cell ? (
            <SectionCollectionsMonthCell
              cell={cell}
              monthLabel={dict.monthShort[idx]!}
              todayMonth={view.todayMonth}
              year={view.year}
              scholarshipDiscountPercent={scholarshipDiscountForPeriod(
                student,
                cell.year,
                cell.month,
              )}
              ariaPrefix={student.studentName}
              locale={locale}
              labels={dict.monthCell}
              selectable={
                cellSelectable &&
                (isCellSelectable?.(cell.month) ?? true)
              }
              selected={isCellSelected?.(cell.month) ?? false}
              onToggle={handleToggleCell}
              currency={currency}
            />
          ) : (
            <span className="text-[10px] text-[var(--color-muted-foreground)]">
              —
            </span>
          )}
        </td>
      ))}
      <td className="px-3 py-2 text-right align-middle text-sm">
        <div className="font-semibold text-[var(--color-success)]">
          {money.format(student.paid)}
        </div>
        <div className="text-[11px] text-[var(--color-error)]">
          {money.format(student.overdue)}
        </div>
      </td>
    </tr>
  );
}
