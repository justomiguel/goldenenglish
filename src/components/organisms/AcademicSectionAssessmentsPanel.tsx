import { ClipboardCheck } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminSectionAssessmentsPanelData } from "@/types/adminSectionAssessments";
import { CohortAssessmentRowActions } from "@/components/molecules/CohortAssessmentRowActions";

type PanelDict = Dictionary["dashboard"]["academicSectionPage"]["assessmentsPanel"];

export interface AcademicSectionAssessmentsPanelProps {
  locale: string;
  cohortId: string;
  sectionId: string;
  data: AdminSectionAssessmentsPanelData;
  dict: PanelDict;
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
  canDeleteCohortAssessments,
}: AcademicSectionAssessmentsPanelProps) {
  const dateFmt = new Intl.DateTimeFormat(locale === "es" ? "es" : "en", { dateStyle: "medium" });
  const nActive = data.activeEnrollmentCount;
  const rubricReturnTo = `/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}?tab=evaluations`;
  return (
    <div className="space-y-8">
      <section className="space-y-2" aria-labelledby="section-assessments-learning">
        <div>
          <h2 id="section-assessments-learning" className="text-base font-semibold text-[var(--color-foreground)]">
            {d.titleLearning}
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">{d.leadLearning}</p>
        </div>
        {data.learning.length ? (
          <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <caption className="px-3 py-2 text-left text-xs font-medium text-[var(--color-muted-foreground)]">
                {d.tableLearning}
              </caption>
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
                <tr>
                  <th className="px-3 py-2 font-medium text-[var(--color-foreground)]">{d.colTitle}</th>
                  <th className="px-3 py-2 font-medium text-[var(--color-foreground)]">{d.colKind}</th>
                  <th className="px-3 py-2 font-medium text-[var(--color-foreground)]">{d.colMode}</th>
                  <th className="px-3 py-2 font-medium text-[var(--color-foreground)]">{d.colPassing}</th>
                  <th className="px-3 py-2 text-right font-medium text-[var(--color-foreground)]">
                    {d.colAttempts}
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-[var(--color-foreground)]">
                    {d.colReviewed}
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-[var(--color-foreground)]">{d.colAvg}</th>
                  <th className="px-3 py-2 text-right font-medium text-[var(--color-foreground)]">
                    {d.colPassed}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.learning.map((row) => (
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
      </section>

      <section className="space-y-2" aria-labelledby="section-assessments-cohort">
        <div>
          <h2 id="section-assessments-cohort" className="text-base font-semibold text-[var(--color-foreground)]">
            {d.titleCohort}
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">{d.leadCohort}</p>
        </div>
        {data.cohort.length ? (
          <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="px-3 py-2 text-left text-xs font-medium text-[var(--color-muted-foreground)]">
                {d.tableCohort}
              </caption>
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
                <tr>
                  <th className="px-3 py-2 font-medium text-[var(--color-foreground)]">{d.colCohortName}</th>
                  <th className="px-3 py-2 font-medium text-[var(--color-foreground)]">{d.colDate}</th>
                  <th className="px-3 py-2 font-medium text-[var(--color-foreground)]">{d.colMax}</th>
                  <th className="px-3 py-2 font-medium text-[var(--color-foreground)]">{d.colPublished}</th>
                  <th className="px-3 py-2 text-right font-medium text-[var(--color-foreground)]">{d.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {data.cohort.map((row) => {
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
      </section>
    </div>
  );
}
