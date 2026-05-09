"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronRight, Users } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { SectionCollectionsView } from "@/types/sectionCollections";
import {
  formatCohortCollectionsMoney,
  formatCohortCollectionsPercent,
  sectionBillingSummary,
} from "@/lib/dashboard/cohortCollectionsMatrixSectionHelpers";
import { Button } from "@/components/atoms/Button";
import { SectionCollectionsHealthBadge } from "./SectionCollectionsHealthBadge";
import { CohortCollectionsMatrixSectionTable } from "./CohortCollectionsMatrixSectionTable";

type FinanceDict = Dictionary["admin"]["finance"];

export interface CohortCollectionsMatrixSectionGroupProps {
  view: SectionCollectionsView;
  monthShort: readonly string[];
  overviewDict: FinanceDict["overview"];
  collectionsDict: FinanceDict["collections"];
  locale: string;
  sectionHref: string;
  visibleStudentIds: ReadonlySet<string> | null;
  /** System-wide billing currency from Finance > Settings. */
  currency: string;
}

export function CohortCollectionsMatrixSectionGroup({
  view,
  monthShort,
  overviewDict,
  collectionsDict,
  locale,
  sectionHref,
  visibleStudentIds,
  currency,
}: CohortCollectionsMatrixSectionGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = visibleStudentIds
    ? view.students.filter((s) => visibleStudentIds.has(s.studentId))
    : view.students;

  if (visibleRows.length === 0 && visibleStudentIds) return null;

  const billing = sectionBillingSummary(view);
  const showEnrollmentFeeColumn = visibleRows.some(
    (s) => (s.enrollmentFee?.amount ?? 0) > 0,
  );
  const matrixPanelId = `section-matrix-${view.sectionId}`;
  const expandLabel = collectionsDict.matrix.expandMatrixAria.replace(
    "{section}",
    view.sectionName,
  );
  const collapseLabel = collectionsDict.matrix.collapseMatrixAria.replace(
    "{section}",
    view.sectionName,
  );

  return (
    <section
      aria-labelledby={`section-${view.sectionId}-title`}
      className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-9 min-w-9 shrink-0 px-0 text-[var(--color-foreground)]"
            aria-expanded={expanded}
            aria-controls={matrixPanelId}
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? collapseLabel : expandLabel}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            )}
          </Button>
          <div className="min-w-0 flex-1 space-y-2">
            <header className="flex flex-wrap items-center gap-2 gap-y-1">
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
                {formatCohortCollectionsPercent(view.kpis.collectionRatio, locale)}{" "}
                {collectionsDict.kpis.collectionRatio.toLowerCase()}
              </span>
            </header>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
              <span className="font-medium text-[var(--color-foreground)]">
                <span className="text-[var(--color-muted-foreground)]">
                  {collectionsDict.kpis.paid}:{" "}
                </span>
                {formatCohortCollectionsMoney(view.kpis.paid, locale, currency)}
              </span>
              <span className="font-medium text-[var(--color-foreground)]">
                <span className="text-[var(--color-muted-foreground)]">
                  {collectionsDict.kpis.expectedYear}:{" "}
                </span>
                {formatCohortCollectionsMoney(
                  view.kpis.expectedYear,
                  locale,
                  currency,
                )}
              </span>
              <span className="font-medium text-[var(--color-foreground)]">
                <span className="text-[var(--color-muted-foreground)]">
                  {collectionsDict.kpis.overdue}:{" "}
                </span>
                {formatCohortCollectionsMoney(view.kpis.overdue, locale, currency)}
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-muted-foreground)]">
              <span className="font-medium text-[var(--color-foreground)]">
                {overviewDict.sectionHeader.monthlyFee}:{" "}
              </span>
              {billing.monthlyFee == null
                ? overviewDict.sectionHeader.noFeePlan
                : formatCohortCollectionsMoney(billing.monthlyFee, locale, currency)}
              <span className="mx-2 text-[var(--color-border)]" aria-hidden>
                ·
              </span>
              <span className="font-medium text-[var(--color-foreground)]">
                {overviewDict.sectionHeader.enrollmentFee}:{" "}
              </span>
              {formatCohortCollectionsMoney(billing.enrollmentFee, locale, currency)}
            </p>
          </div>
        </div>
        <Link
          href={sectionHref}
          title={overviewDict.sectionHeader.openSectionTooltip}
          className="inline-flex min-h-[36px] shrink-0 items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-muted)]/40"
        >
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          {overviewDict.sectionHeader.openSection}
        </Link>
      </div>

      {expanded ? (
        <div
          id={matrixPanelId}
          role="region"
          aria-label={view.sectionName}
          className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-2 shadow-[inset_0_1px_0_0_var(--color-border)]"
        >
          <div className="overflow-x-auto rounded-[var(--layout-border-radius)] bg-[var(--color-surface)]">
            <CohortCollectionsMatrixSectionTable
              view={view}
              monthShort={monthShort}
              overviewDict={overviewDict}
              collectionsDict={collectionsDict}
              locale={locale}
              visibleRows={visibleRows}
              showEnrollmentFeeColumn={showEnrollmentFeeColumn}
              currency={currency}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
