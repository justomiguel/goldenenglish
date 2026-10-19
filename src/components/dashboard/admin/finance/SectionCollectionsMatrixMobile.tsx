"use client";

import { useState } from "react";
import Link from "next/link";
import type { SectionCollectionsStudentRow, SectionCollectionsView } from "@/types/sectionCollections";
import type { Dictionary } from "@/types/i18n";
import { resolveMatrixScholarshipMarks } from "@/lib/billing/resolveMatrixScholarshipMarks";
import { isSectionCollectionsEnrollmentFeeMatrixCellSelectable } from "@/lib/billing/sectionCollectionsEnrollmentFeeMatrixCell";
import { SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH } from "@/lib/billing/sectionCollectionsEnrollmentFeeCellMonth";
import { Label } from "@/components/atoms/Label";
import { SectionCollectionsEnrollmentFeeCell } from "./SectionCollectionsEnrollmentFeeCell";
import { SectionCollectionsMonthCell } from "./SectionCollectionsMonthCell";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export interface SectionCollectionsMatrixMobileProps {
  students: readonly SectionCollectionsStudentRow[];
  view: SectionCollectionsView;
  dict: CollectionsDict;
  locale: string;
  currency?: string;
  monthShort: readonly string[];
  showEnrollmentFeeColumn: boolean;
  selectedIds?: ReadonlySet<string>;
  onToggleStudent?: (id: string, next: boolean) => void;
  cellSelectable?: boolean;
  isCellSelected?: (studentId: string, month: number) => boolean;
  isCellSelectable?: (studentId: string, month: number) => boolean;
  onToggleCell?: (studentId: string, month: number) => void;
  paidLabel: string;
  overdueLabel: string;
}

/** One student, then a vertical list of month cells. */
export function SectionCollectionsMatrixMobile({
  students,
  view,
  dict,
  locale,
  currency = "USD",
  monthShort,
  showEnrollmentFeeColumn,
  selectedIds,
  onToggleStudent,
  cellSelectable = false,
  isCellSelected,
  isCellSelectable,
  onToggleCell,
  paidLabel,
  overdueLabel,
}: SectionCollectionsMatrixMobileProps) {
  const [studentId, setStudentId] = useState(students[0]?.studentId ?? "");
  const student = students.find((row) => row.studentId === studentId) ?? students[0];
  if (!student) return null;

  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
  const scholarshipMarks = resolveMatrixScholarshipMarks({
    scholarships: student.scholarships,
    year: view.year,
    cells: student.row.cells,
  });
  const enrollmentSelectable =
    cellSelectable &&
    showEnrollmentFeeColumn &&
    isSectionCollectionsEnrollmentFeeMatrixCellSelectable(student, view, showEnrollmentFeeColumn) &&
    (isCellSelectable?.(student.studentId, SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH) ?? true);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="collections-mobile-student">{dict.matrix.mobilePickStudent}</Label>
        <select
          id="collections-mobile-student"
          className="min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
          value={student.studentId}
          onChange={(event) => setStudentId(event.target.value)}
        >
          {students.map((row) => (
            <option key={row.studentId} value={row.studentId}>
              {row.studentName}
            </option>
          ))}
        </select>
      </div>
      {onToggleStudent && selectedIds ? (
        <label className="inline-flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[var(--color-primary)]"
            checked={selectedIds.has(student.studentId)}
            onChange={(event) => onToggleStudent(student.studentId, event.target.checked)}
            aria-label={dict.matrix.selectStudentAria.replace("{name}", student.studentName)}
          />
          {dict.matrix.selectStudentAria.replace("{name}", student.studentName)}
        </label>
      ) : null}
      <Link
        href={`/${locale}/dashboard/admin/users/${student.studentId}/billing`}
        className="inline-flex min-h-11 items-center text-sm font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
      >
        {student.studentName}
      </Link>
      {showEnrollmentFeeColumn ? (
        <SectionCollectionsEnrollmentFeeCell
          student={student}
          view={view}
          ariaLabel={dict.matrix.enrollmentFeeChipAria.replace("{name}", student.studentName)}
          selectable={enrollmentSelectable}
          selected={isCellSelected?.(student.studentId, 0) ?? false}
          onToggle={
            enrollmentSelectable && onToggleCell
              ? (sid) => onToggleCell(sid, 0)
              : undefined
          }
        />
      ) : null}
      <ul className="space-y-2">
        {MONTHS.map((month, index) => {
          const cell = student.row.cells.find((item) => item.month === month && item.year === view.year);
          return (
            <li key={month} className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-sm font-medium text-[var(--color-muted-foreground)]">
                {monthShort[index]}
              </span>
              <div className="min-w-0 flex-1">
                {cell ? (
                  <SectionCollectionsMonthCell
                    cell={cell}
                    monthLabel={monthShort[index] ?? String(month)}
                    todayMonth={view.todayMonth}
                    year={view.year}
                    scholarshipDiscountPercent={scholarshipMarks.percentByMonth[cell.month - 1]}
                    ariaPrefix={student.studentName}
                    locale={locale}
                    labels={dict.monthCell}
                    selectable={cellSelectable && (isCellSelectable?.(student.studentId, cell.month) ?? true)}
                    selected={isCellSelected?.(student.studentId, cell.month) ?? false}
                    onToggle={(picked) => onToggleCell?.(student.studentId, picked)}
                    stacked
                    currency={currency}
                  />
                ) : (
                  <span className="text-sm text-[var(--color-muted-foreground)]">—</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{paidLabel}</dt>
          <dd className="font-semibold text-[var(--color-success)]">{money.format(student.paid)}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{overdueLabel}</dt>
          <dd className="font-semibold text-[var(--color-error)]">{money.format(student.overdue)}</dd>
        </div>
      </dl>
    </div>
  );
}
