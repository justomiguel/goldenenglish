"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/types/i18n";
import type { CohortCollectionsMatrix } from "@/types/cohortCollectionsMatrix";
import { CohortCollectionsMatrixSectionGroup } from "./CohortCollectionsMatrixSectionGroup";

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
    maximumFractionDigits: 1,
  }).format(ratio);
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export interface CohortCollectionsMatrixClientProps {
  matrix: CohortCollectionsMatrix;
  overviewDict: FinanceDict["overview"];
  collectionsDict: FinanceDict["collections"];
  locale: string;
  /** Base href used to deep-link into the per-section drill-down matrix. */
  sectionHrefBase: string;
  /** Currency used for the totals row (cohort default). */
  totalsCurrency?: string;
}

export function CohortCollectionsMatrixClient({
  matrix,
  overviewDict,
  collectionsDict,
  locale,
  sectionHrefBase,
  totalsCurrency = "USD",
}: CohortCollectionsMatrixClientProps) {
  const [search, setSearch] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const visibleStudentIds = useMemo<ReadonlySet<string> | null>(() => {
    const trimmed = search.trim();
    if (!trimmed && !onlyOverdue) return null;
    const term = normalize(trimmed);
    const ids = new Set<string>();
    for (const s of matrix.sections) {
      for (const stu of s.view.students) {
        const matchesSearch =
          term.length === 0 ||
          normalize(stu.studentName).includes(term) ||
          (stu.documentLabel ? normalize(stu.documentLabel).includes(term) : false);
        const matchesOverdue = !onlyOverdue || stu.hasOverdue;
        if (matchesSearch && matchesOverdue) ids.add(stu.studentId);
      }
    }
    return ids;
  }, [matrix, search, onlyOverdue]);

  const monthShort = collectionsDict.monthShort;

  const visibleSectionCount = useMemo(() => {
    if (!visibleStudentIds) return matrix.sections.length;
    let n = 0;
    for (const s of matrix.sections) {
      if (s.view.students.some((stu) => visibleStudentIds.has(stu.studentId))) n += 1;
    }
    return n;
  }, [matrix.sections, visibleStudentIds]);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-wrap items-end gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3"
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-[var(--color-foreground)]">
            {overviewDict.filters.search}
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={overviewDict.filters.searchPlaceholder}
            className="w-64 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-foreground)]"
          />
        </label>
        <label className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-foreground)]">
          <input
            type="checkbox"
            checked={onlyOverdue}
            onChange={(e) => setOnlyOverdue(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--color-border)]"
          />
          {overviewDict.filters.onlyOverdue}
        </label>
      </form>

      <section
        aria-labelledby="cohort-totals"
        className="grid grid-cols-2 gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-4"
      >
        <h2 id="cohort-totals" className="sr-only">
          {overviewDict.totals.title}
        </h2>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {overviewDict.totals.expectedYear}
          </p>
          <p className="text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
            {formatMoney(matrix.totals.expectedYear, locale, totalsCurrency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {overviewDict.totals.collected}
          </p>
          <p className="text-sm font-semibold tabular-nums text-[var(--color-success)]">
            {formatMoney(matrix.totals.paid, locale, totalsCurrency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {overviewDict.totals.overdue}
          </p>
          <p className="text-sm font-semibold tabular-nums text-[var(--color-error)]">
            {formatMoney(matrix.totals.overdue, locale, totalsCurrency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {overviewDict.totals.ratio}
          </p>
          <p className="text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
            {formatPercent(matrix.totals.collectionRatio, locale)}
          </p>
        </div>
      </section>

      {matrix.sections.length === 0 ? (
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
          {overviewDict.empty.noSections}
        </p>
      ) : visibleSectionCount === 0 ? (
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
          {overviewDict.empty.noStudentsAfterFilter}
        </p>
      ) : (
        <div className="space-y-3">
          {matrix.sections.map((s) => (
            <CohortCollectionsMatrixSectionGroup
              key={s.view.sectionId}
              view={s.view}
              monthShort={monthShort}
              overviewDict={overviewDict}
              collectionsDict={collectionsDict}
              locale={locale}
              sectionHref={`${sectionHrefBase}/${s.view.sectionId}`}
              visibleStudentIds={visibleStudentIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
