"use client";

import type { SectionCollectionsView } from "@/types/sectionCollections";
import type { Dictionary } from "@/types/i18n";
import { SortableColumnHeader } from "@/components/molecules/SortableColumnHeader";
import { useSectionCollectionsMatrixSort } from "@/hooks/useSectionCollectionsMatrixSort";
import { SectionCollectionsMatrixStudentRow } from "./SectionCollectionsMatrixStudentRow";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function moneyFormatter(locale: string, currency: string): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}

export interface SectionCollectionsMatrixTableProps {
  view: SectionCollectionsView;
  dict: CollectionsDict;
  locale: string;
  currency?: string;
  selectedIds: Set<string>;
  onToggleStudent: (id: string, next: boolean) => void;
  onToggleAll: (next: boolean) => void;
}

export function SectionCollectionsMatrixTable({
  view,
  dict,
  locale,
  currency = "USD",
  selectedIds,
  onToggleStudent,
  onToggleAll,
}: SectionCollectionsMatrixTableProps) {
  const money = moneyFormatter(locale, currency);
  const sortLabels = dict.matrix.columnSort;
  const { sortKey, sortDir, sortedStudents, onToggleSort } = useSectionCollectionsMatrixSort(view.students);

  if (view.students.length === 0) {
    return (
      <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        {dict.matrix.empty}
      </p>
    );
  }
  const allSelected =
    sortedStudents.length > 0 &&
    sortedStudents.every((s) => selectedIds.has(s.studentId));
  const showEnrollmentFeeColumn = view.students.some(
    (s) => (s.enrollmentFee?.amount ?? 0) > 0,
  );
  return (
    <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
      <table className="w-full min-w-[860px] table-fixed border-collapse text-sm">
        <thead className="bg-[var(--color-muted)]/35 text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
          <tr>
            <th scope="col" className="w-10 px-3 py-2 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onToggleAll(e.target.checked)}
                aria-label={dict.matrix.selectAllAria}
                className="h-4 w-4 cursor-pointer accent-[var(--color-primary)]"
              />
            </th>
            <th
              scope="col"
              className="w-[220px] px-3 py-2 text-left"
              aria-sort={sortKey === "student" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
            >
              <SortableColumnHeader
                columnId="student"
                label={dict.matrix.studentColumn}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggleSort={onToggleSort}
                sortLabels={sortLabels}
              />
            </th>
            {showEnrollmentFeeColumn ? (
              <th scope="col" className="w-12 px-1 py-2 text-center">
                <abbr title={dict.matrix.monthZeroTooltip} className="no-underline">
                  {dict.matrix.monthZeroColumnShort}
                </abbr>
              </th>
            ) : null}
            {MONTHS.map((m, i) => (
              <th key={m} scope="col" className="w-12 px-1 py-2 text-center">
                {dict.monthShort[i]}
              </th>
            ))}
            <th
              scope="col"
              className="w-[140px] px-3 py-2 text-right"
              aria-sort={sortKey === "totals" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
            >
              <SortableColumnHeader
                columnId="totals"
                label={dict.matrix.yearTotalsColumn}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggleSort={onToggleSort}
                sortLabels={sortLabels}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedStudents.map((s) => (
            <SectionCollectionsMatrixStudentRow
              key={s.studentId}
              student={s}
              view={view}
              dict={dict}
              selected={selectedIds.has(s.studentId)}
              onToggle={onToggleStudent}
              money={money}
              locale={locale}
              showEnrollmentFeeColumn={showEnrollmentFeeColumn}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
