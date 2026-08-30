"use client";

import { BookOpen, ClipboardCheck } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminSectionAssessmentsPanelData } from "@/types/adminSectionAssessments";
import { AcademicSectionAreaBlock } from "@/components/molecules/AcademicSectionAreaBlock";
import { AcademicSectionAreaSummaryBand } from "@/components/molecules/AcademicSectionAreaSummaryBand";
import { CohortAssessmentRowActions } from "@/components/molecules/CohortAssessmentRowActions";
import { AssessmentGradingPathStrip } from "@/components/molecules/AssessmentGradingPathStrip";
import { SortableTh } from "@/components/molecules/SortableTh";
import { useClientTableSort } from "@/hooks/useClientTableSort";
import { tableSortLabels } from "@/lib/i18n/tableSortLabels";

type PanelDict = Dictionary["dashboard"]["academicSectionPage"]["assessmentsPanel"];
type GradingPathDict = Dictionary["dashboard"]["teacherAssessmentMatrix"]["path"];

export interface AcademicSectionAssessmentsPanelProps {
  locale: string;
  cohortId: string;
  sectionId: string;
  data: AdminSectionAssessmentsPanelData;
  dict: PanelDict;
  gradingPathDict: GradingPathDict;
  /** When true, staff may delete cohort exams (admin RLS). */
  canDeleteCohortAssessments: boolean;
}

function labelKind(kind: string, d: PanelDict) {
  const m = d.kind;
  if (kind === "entry") return m.entry;
  if (kind === "exit") return m.exit;
  if (kind === "formative") return m.formative;
  if (kind === "mini_test") return m.mini_test;
  if (kind === "diagnostic") return m.diagnostic;
  return m.other;
}

function labelGrading(mode: string, d: PanelDict) {
  const g = d.grading;
  if (mode === "numeric") return g.numeric;
  if (mode === "pass_fail") return g.pass_fail;
  if (mode === "diagnostic") return g.diagnostic;
  if (mode === "rubric") return g.rubric;
  if (mode === "manual_feedback") return g.manual_feedback;
  return mode;
}

export function AcademicSectionAssessmentsPanel({
  locale,
  cohortId,
  sectionId,
  data,
  dict: d,
  gradingPathDict,
  canDeleteCohortAssessments,
}: AcademicSectionAssessmentsPanelProps) {
  const dateFmt = new Intl.DateTimeFormat(locale === "es" ? "es" : "en", { dateStyle: "medium" });
  const nActive = data.activeEnrollmentCount;
  const rubricReturnTo = `/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}?tab=evaluations`;
  const cohortPathStep = data.cohort.length === 0 ? 1 : 2;
  const sortLabels = tableSortLabels(locale);
  const {
    sortKey: learningSortKey,
    sortDir: learningSortDir,
    onToggleSort: onToggleLearningSort,
    sortedRows: sortedLearning,
  } = useClientTableSort(
    data.learning,
    {
      title: (row) => row.title,
      kind: (row) => labelKind(row.assessmentKind, d),
      mode: (row) => labelGrading(row.gradingMode, d),
      passing: (row) => row.passingScore,
      attempts: (row) => row.attemptCount,
      reviewed: (row) => row.reviewedCount,
      avg: (row) => row.avgScore,
      passed: (row) => row.passedCount,
    },
    "title",
  );
  const {
    sortKey: cohortSortKey,
    sortDir: cohortSortDir,
    onToggleSort: onToggleCohortSort,
    sortedRows: sortedCohort,
  } = useClientTableSort(
    data.cohort,
    {
      name: (row) => row.name,
      date: (row) => row.assessmentOn,
      max: (row) => row.maxScore,
      published: (row) => row.publishedInSection,
    },
    "name",
  );

  return (
    <div className="space-y-8">
      <AcademicSectionAreaSummaryBand ariaLabel={d.summaryTitle}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {d.summaryLearningLabel}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--color-foreground)]">
              {data.learning.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {d.summaryCohortLabel}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--color-foreground)]">
              {data.cohort.length}
            </p>
          </div>
        </div>
      </AcademicSectionAreaSummaryBand>

      <AcademicSectionAreaBlock
        id="section-assessments-learning"
        title={d.titleLearning}
        lead={d.leadLearning}
        icon={BookOpen}
      >
        {data.learning.length ? (
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <caption className="px-3 py-2 text-left text-xs font-medium text-[var(--color-muted-foreground)]">
                {d.tableLearning}
              </caption>
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
                <tr>
                  <SortableTh columnId="title" label={d.colTitle} sortKey={learningSortKey} sortDir={learningSortDir} onToggleSort={onToggleLearningSort} sortLabels={sortLabels} className="px-3 py-2 font-medium text-[var(--color-foreground)]" />
                  <SortableTh columnId="kind" label={d.colKind} sortKey={learningSortKey} sortDir={learningSortDir} onToggleSort={onToggleLearningSort} sortLabels={sortLabels} className="px-3 py-2 font-medium text-[var(--color-foreground)]" />
                  <SortableTh columnId="mode" label={d.colMode} sortKey={learningSortKey} sortDir={learningSortDir} onToggleSort={onToggleLearningSort} sortLabels={sortLabels} className="px-3 py-2 font-medium text-[var(--color-foreground)]" />
                  <SortableTh columnId="passing" label={d.colPassing} sortKey={learningSortKey} sortDir={learningSortDir} onToggleSort={onToggleLearningSort} sortLabels={sortLabels} className="px-3 py-2 font-medium text-[var(--color-foreground)]" />
                  <SortableTh columnId="attempts" label={d.colAttempts} sortKey={learningSortKey} sortDir={learningSortDir} onToggleSort={onToggleLearningSort} sortLabels={sortLabels} className="px-3 py-2 text-right font-medium text-[var(--color-foreground)]" />
                  <SortableTh columnId="reviewed" label={d.colReviewed} sortKey={learningSortKey} sortDir={learningSortDir} onToggleSort={onToggleLearningSort} sortLabels={sortLabels} className="px-3 py-2 text-right font-medium text-[var(--color-foreground)]" />
                  <SortableTh columnId="avg" label={d.colAvg} sortKey={learningSortKey} sortDir={learningSortDir} onToggleSort={onToggleLearningSort} sortLabels={sortLabels} className="px-3 py-2 text-right font-medium text-[var(--color-foreground)]" />
                  <SortableTh columnId="passed" label={d.colPassed} sortKey={learningSortKey} sortDir={learningSortDir} onToggleSort={onToggleLearningSort} sortLabels={sortLabels} className="px-3 py-2 text-right font-medium text-[var(--color-foreground)]" />
                </tr>
              </thead>
              <tbody>
                {sortedLearning.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2 align-top text-[var(--color-foreground)]">
                      <span className="inline-flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
                        <span className="font-medium">{row.title}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                      {labelKind(row.assessmentKind, d)}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                      {labelGrading(row.gradingMode, d)}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                      {row.passingScore != null ? String(row.passingScore) : d.emDash}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-[var(--color-foreground)]">
                      {row.attemptCount}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-[var(--color-muted-foreground)]">
                      {row.reviewedCount}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-[var(--color-muted-foreground)]">
                      {row.avgScore != null ? String(row.avgScore) : d.emDash}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-[var(--color-muted-foreground)]">
                      {row.passedCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted-foreground)]">{d.emptyLearning}</p>
        )}
      </AcademicSectionAreaBlock>

      <AcademicSectionAreaBlock
        id="section-assessments-cohort"
        title={d.titleCohort}
        lead={d.leadCohort}
        icon={ClipboardCheck}
      >
        <AssessmentGradingPathStrip currentStep={cohortPathStep} labels={gradingPathDict} countsText={null} />

        {data.cohort.length ? (
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="px-3 py-2 text-left text-xs font-medium text-[var(--color-muted-foreground)]">
                {d.tableCohort}
              </caption>
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
                <tr>
                  <SortableTh columnId="name" label={d.colCohortName} sortKey={cohortSortKey} sortDir={cohortSortDir} onToggleSort={onToggleCohortSort} sortLabels={sortLabels} className="px-3 py-2 font-medium text-[var(--color-foreground)]" />
                  <SortableTh columnId="date" label={d.colDate} sortKey={cohortSortKey} sortDir={cohortSortDir} onToggleSort={onToggleCohortSort} sortLabels={sortLabels} className="px-3 py-2 font-medium text-[var(--color-foreground)]" />
                  <SortableTh columnId="max" label={d.colMax} sortKey={cohortSortKey} sortDir={cohortSortDir} onToggleSort={onToggleCohortSort} sortLabels={sortLabels} className="px-3 py-2 font-medium text-[var(--color-foreground)]" />
                  <SortableTh columnId="published" label={d.colPublished} sortKey={cohortSortKey} sortDir={cohortSortDir} onToggleSort={onToggleCohortSort} sortLabels={sortLabels} className="px-3 py-2 font-medium text-[var(--color-foreground)]" />
                  <th className="px-3 py-2 text-right font-medium text-[var(--color-foreground)]">{d.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {sortedCohort.map((row) => {
                  const pub = `${row.publishedInSection} / ${nActive}`;
                  return (
                    <tr key={row.id} className="border-t border-[var(--color-border)]">
                      <td className="px-3 py-2 text-[var(--color-foreground)]">{row.name}</td>
                      <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                        {dateFmt.format(new Date(`${row.assessmentOn}T12:00:00`))}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-[var(--color-muted-foreground)]">{row.maxScore}</td>
                      <td className="px-3 py-2 text-[var(--color-muted-foreground)]">{pub}</td>
                      <td className="px-3 py-2 text-right align-top">
                        <CohortAssessmentRowActions
                          locale={locale}
                          cohortId={cohortId}
                          sectionId={sectionId}
                          row={{
                            id: row.id,
                            name: row.name,
                            assessmentOn: row.assessmentOn,
                            maxScore: row.maxScore,
                            createdAt: row.createdAt,
                          }}
                          rubricReturnTo={rubricReturnTo}
                          canDelete={canDeleteCohortAssessments}
                          dict={d}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted-foreground)]">{d.emptyCohort}</p>
        )}
      </AcademicSectionAreaBlock>
    </div>
  );
}
