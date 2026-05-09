import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { SectionCollectionsStudentRow, SectionCollectionsView } from "@/types/sectionCollections";
import {
  formatCohortCollectionsMoney,
  scholarshipDiscountForCohortMatrixPeriod,
} from "@/lib/dashboard/cohortCollectionsMatrixSectionHelpers";
import { SectionCollectionsEnrollmentFeeCell } from "./SectionCollectionsEnrollmentFeeCell";
import { SectionCollectionsMonthCell } from "./SectionCollectionsMonthCell";
import { SectionCollectionsStudentBenefits } from "./SectionCollectionsStudentBenefits";

type FinanceDict = Dictionary["admin"]["finance"];

export interface CohortCollectionsMatrixSectionTableProps {
  view: SectionCollectionsView;
  monthShort: readonly string[];
  overviewDict: FinanceDict["overview"];
  collectionsDict: FinanceDict["collections"];
  locale: string;
  visibleRows: SectionCollectionsStudentRow[];
  showEnrollmentFeeColumn: boolean;
  /** System-wide billing currency from Finance > Settings. */
  currency: string;
}

export function CohortCollectionsMatrixSectionTable({
  view,
  monthShort,
  overviewDict,
  collectionsDict,
  locale,
  visibleRows,
  showEnrollmentFeeColumn,
  currency,
}: CohortCollectionsMatrixSectionTableProps) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
          <th className="sticky left-0 z-10 min-w-[180px] bg-[var(--color-surface)] px-2 py-2">
            {overviewDict.table.studentColumn}
          </th>
          {showEnrollmentFeeColumn ? (
            <th scope="col" className="w-12 px-1 py-2 text-center">
              <abbr
                title={collectionsDict.matrix.monthZeroTooltip}
                className="no-underline"
              >
                {collectionsDict.matrix.monthZeroColumnShort}
              </abbr>
            </th>
          ) : null}
          {monthShort.map((m, idx) => (
            <th key={`m-${idx}`} className="px-1 py-2 text-center" scope="col">
              {m}
            </th>
          ))}
          <th className="px-2 py-2 text-right" scope="col">
            {overviewDict.table.paidLabel}
          </th>
          <th className="px-2 py-2 text-right" scope="col">
            {overviewDict.table.expectedLabel}
          </th>
          <th className="px-2 py-2 text-right" scope="col">
            {overviewDict.table.overdueLabel}
          </th>
        </tr>
      </thead>
      <tbody>
        {visibleRows.map((s) => (
            <tr key={s.studentId} className="border-t border-[var(--color-border)]/60">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-[var(--color-surface)] px-2 py-1.5 text-left font-medium text-[var(--color-foreground)]"
              >
                <Link
                  href={`/${locale}/dashboard/admin/users/${s.studentId}/billing`}
                  className="group inline-flex max-w-full items-center gap-1 font-medium text-[var(--color-primary)] hover:underline"
                  title={s.studentName}
                  aria-label={collectionsDict.matrix.openStudentBillingAria.replace(
                    "{name}",
                    s.studentName,
                  )}
                >
                  <span className="block truncate">{s.studentName}</span>
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 opacity-70 transition group-hover:opacity-100"
                    aria-hidden
                  />
                </Link>
                {s.documentLabel ? (
                  <span className="block text-[10px] text-[var(--color-muted-foreground)]">
                    {s.documentLabel}
                  </span>
                ) : null}
                <SectionCollectionsStudentBenefits
                  student={s}
                  labels={collectionsDict.benefits}
                  locale={locale}
                />
              </th>
              {showEnrollmentFeeColumn ? (
                <td className="px-0.5 py-1 text-center align-middle">
                  <SectionCollectionsEnrollmentFeeCell
                    student={s}
                    view={view}
                    ariaLabel={collectionsDict.matrix.enrollmentFeeChipAria.replace(
                      "{name}",
                      s.studentName,
                    )}
                  />
                </td>
              ) : null}
              {s.row.cells.map((cell) => (
                <td key={`${s.studentId}-${cell.year}-${cell.month}`} className="px-0.5 py-1 text-center">
                  <SectionCollectionsMonthCell
                    cell={cell}
                    monthLabel={monthShort[cell.month - 1] ?? String(cell.month)}
                    todayMonth={view.todayMonth}
                    year={view.year}
                    scholarshipDiscountPercent={scholarshipDiscountForCohortMatrixPeriod(
                      s,
                      cell.year,
                      cell.month,
                    )}
                    ariaPrefix={s.studentName}
                    locale={locale}
                    labels={collectionsDict.monthCell}
                    currency={currency}
                  />
                </td>
              ))}
              <td className="px-2 py-1 text-right text-[11px] font-semibold tabular-nums text-[var(--color-success)]">
                {formatCohortCollectionsMoney(s.paid, locale, currency)}
              </td>
              <td className="px-2 py-1 text-right text-[11px] font-semibold tabular-nums text-[var(--color-muted-foreground)]">
                {formatCohortCollectionsMoney(s.expectedYear, locale, currency)}
              </td>
              <td className="px-2 py-1 text-right text-[11px] font-semibold tabular-nums text-[var(--color-error)]">
                {formatCohortCollectionsMoney(s.overdue, locale, currency)}
              </td>
            </tr>
        ))}
      </tbody>
    </table>
  );
}
