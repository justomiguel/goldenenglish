"use client";

import type {
  SectionCollectionsView,
  SectionCollectionsStudentRow,
} from "@/types/sectionCollections";
import type { Dictionary } from "@/types/i18n";
import { SectionCollectionsMonthCell } from "./SectionCollectionsMonthCell";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function moneyFormatter(locale: string, currency: string): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}

interface RowProps {
  student: SectionCollectionsStudentRow;
  view: SectionCollectionsView;
  dict: CollectionsDict;
  selected: boolean;
  onToggle: (id: string, next: boolean) => void;
  money: Intl.NumberFormat;
  locale: string;
}

function StudentRow({
  student,
  view,
  dict,
  selected,
  onToggle,
  money,
  locale,
}: RowProps) {
  const cells = MONTHS.map((m) =>
    student.row.cells.find((c) => c.month === m && c.year === view.year),
  );
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
        <div className="text-sm font-medium text-[var(--color-foreground)]">
          {student.studentName}
        </div>
        {student.documentLabel ? (
          <div className="text-[11px] text-[var(--color-muted-foreground)]">
            {student.documentLabel}
          </div>
        ) : null}
      </td>
      {cells.map((cell, idx) => (
        <td key={MONTHS[idx]} className="px-1 py-1 text-center align-middle">
          {cell ? (
            <SectionCollectionsMonthCell
              cell={cell}
              monthLabel={dict.monthShort[idx]!}
              todayMonth={view.todayMonth}
              year={view.year}
              ariaPrefix={student.studentName}
              locale={locale}
              labels={dict.monthCell}
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
  if (view.students.length === 0) {
    return (
      <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        {dict.matrix.empty}
      </p>
    );
  }
  const allSelected =
    view.students.length > 0 &&
    view.students.every((s) => selectedIds.has(s.studentId));
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
            <th scope="col" className="w-[220px] px-3 py-2 text-left">
              {dict.matrix.studentColumn}
            </th>
            {MONTHS.map((m, i) => (
              <th key={m} scope="col" className="w-12 px-1 py-2 text-center">
                {dict.monthShort[i]}
              </th>
            ))}
            <th scope="col" className="w-[140px] px-3 py-2 text-right">
              {dict.matrix.yearTotalsColumn}
            </th>
          </tr>
        </thead>
        <tbody>
          {view.students.map((s) => (
            <StudentRow
              key={s.studentId}
              student={s}
              view={view}
              dict={dict}
              selected={selectedIds.has(s.studentId)}
              onToggle={onToggleStudent}
              money={money}
              locale={locale}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
