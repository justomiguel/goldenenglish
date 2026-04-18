import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { SectionCollectionsView } from "@/types/sectionCollections";
import { SectionCollectionsHealthBadge } from "./SectionCollectionsHealthBadge";
import { SectionCollectionsMonthCell } from "./SectionCollectionsMonthCell";

type FinanceDict = Dictionary["admin"]["finance"];

function formatMoney(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(ratio: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(ratio);
}

function studentCellCurrency(cells: SectionCollectionsView["students"][number]["row"]["cells"]): string {
  for (const c of cells) {
    if (c.currency) return c.currency;
  }
  return "USD";
}

export interface CohortCollectionsMatrixSectionGroupProps {
  view: SectionCollectionsView;
  monthShort: readonly string[];
  overviewDict: FinanceDict["overview"];
  collectionsDict: FinanceDict["collections"];
  locale: string;
  sectionHref: string;
  visibleStudentIds: ReadonlySet<string> | null;
}

export function CohortCollectionsMatrixSectionGroup({
  view,
  monthShort,
  overviewDict,
  collectionsDict,
  locale,
  sectionHref,
  visibleStudentIds,
}: CohortCollectionsMatrixSectionGroupProps) {
  const visibleRows = visibleStudentIds
    ? view.students.filter((s) => visibleStudentIds.has(s.studentId))
    : view.students;

  if (visibleRows.length === 0 && visibleStudentIds) return null;

  const currency =
    visibleRows.length > 0 ? studentCellCurrency(visibleRows[0]!.row.cells) : "USD";

  return (
    <section
      aria-labelledby={`section-${view.sectionId}-title`}
      className="space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3
            id={`section-${view.sectionId}-title`}
            className="font-display text-sm font-semibold text-[var(--color-primary)]"
          >
            {view.sectionName}
          </h3>
          <SectionCollectionsHealthBadge
            health={view.kpis.health}
            dict={collectionsDict}
            size="sm"
          />
          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {overviewDict.sectionHeader.studentsCount.replace(
              "{count}",
              String(view.kpis.totalStudents),
            )}
          </span>
          {view.kpis.overdueStudents > 0 ? (
            <span className="text-xs font-semibold text-[var(--color-error)]">
              {overviewDict.sectionHeader.overdueCount.replace(
                "{count}",
                String(view.kpis.overdueStudents),
              )}
            </span>
          ) : null}
          <span className="text-xs text-[var(--color-muted-foreground)]">
            {formatPercent(view.kpis.collectionRatio, locale)}{" "}
            {collectionsDict.kpis.collectionRatio.toLowerCase()}
          </span>
        </div>
        <Link
          href={sectionHref}
          title={overviewDict.sectionHeader.openSectionTooltip}
          className="inline-flex items-center gap-1 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-muted)]/40"
        >
          {overviewDict.sectionHeader.openSection}
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
              <th className="sticky left-0 z-10 min-w-[180px] bg-[var(--color-surface)] px-2 py-2">
                {overviewDict.table.studentColumn}
              </th>
              {monthShort.map((m, idx) => (
                <th
                  key={`m-${idx}`}
                  className="px-1 py-2 text-center"
                  scope="col"
                >
                  {m}
                </th>
              ))}
              <th className="px-2 py-2 text-right">
                {overviewDict.table.yearTotalsColumn}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((s) => (
              <tr
                key={s.studentId}
                className="border-t border-[var(--color-border)]/60"
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-[var(--color-surface)] px-2 py-1.5 text-left font-medium text-[var(--color-foreground)]"
                >
                  <span className="block truncate" title={s.studentName}>
                    {s.studentName}
                  </span>
                  {s.documentLabel ? (
                    <span className="block text-[10px] text-[var(--color-muted-foreground)]">
                      {s.documentLabel}
                    </span>
                  ) : null}
                </th>
                {s.row.cells.map((cell) => (
                  <td
                    key={`${s.studentId}-${cell.year}-${cell.month}`}
                    className="px-0.5 py-1 text-center"
                  >
                    <SectionCollectionsMonthCell
                      cell={cell}
                      monthLabel={monthShort[cell.month - 1] ?? String(cell.month)}
                      todayMonth={view.todayMonth}
                      year={view.year}
                      ariaPrefix={s.studentName}
                    />
                  </td>
                ))}
                <td className="px-2 py-1 text-right text-[11px] font-semibold tabular-nums">
                  <span className="text-[var(--color-success)]">
                    {formatMoney(s.paid, locale, currency)}
                  </span>
                  <span className="ms-1 text-[10px] text-[var(--color-muted-foreground)]">
                    /{formatMoney(s.expectedYear, locale, currency)}
                  </span>
                  {s.overdue > 0 ? (
                    <span className="ms-1 text-[10px] font-semibold text-[var(--color-error)]">
                      {formatMoney(s.overdue, locale, currency)}↯
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
