"use client";

import { CohortAssessmentRowActions } from "@/components/molecules/CohortAssessmentRowActions";
import { SortableTh } from "@/components/molecules/SortableTh";
import { useClientTableSort } from "@/hooks/useClientTableSort";
import { tableSortLabels } from "@/lib/i18n/tableSortLabels";
import type { Dictionary } from "@/types/i18n";

type AssessmentRow = {
  id: string;
  name: string;
  assessment_on: string;
  max_score: number | string;
  created_at: string;
};

export function TeacherSectionAssessmentsTable({
  locale,
  cohortId,
  sectionId,
  rows,
  canDelete,
  tableName,
  tableDate,
  tableMax,
  colActions,
  dict,
}: {
  locale: string;
  cohortId: string;
  sectionId: string;
  rows: AssessmentRow[];
  canDelete: boolean;
  tableName: string;
  tableDate: string;
  tableMax: string;
  colActions: string;
  dict: Dictionary["dashboard"]["academicSectionPage"]["assessmentsPanel"];
}) {
  const dateFmt = new Intl.DateTimeFormat(locale === "es" ? "es" : "en", { dateStyle: "medium" });
  const sortLabels = tableSortLabels(locale);
  const { sortKey, sortDir, onToggleSort, sortedRows } = useClientTableSort(
    rows,
    {
      name: (r) => r.name,
      date: (r) => r.assessment_on,
      max: (r) => Number(r.max_score) || 0,
    },
    "name",
  );

  return (
    <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--color-muted)]/40">
          <tr>
            <SortableTh columnId="name" label={tableName} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2 font-medium text-[var(--color-foreground)]" />
            <SortableTh columnId="date" label={tableDate} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2 font-medium text-[var(--color-foreground)]" />
            <SortableTh columnId="max" label={tableMax} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2 font-medium text-[var(--color-foreground)]" />
            <th className="px-3 py-2 text-right font-medium text-[var(--color-foreground)]">
              {colActions}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((a) => (
            <tr key={a.id} className="border-t border-[var(--color-border)]">
              <td className="px-3 py-2 text-[var(--color-foreground)]">{a.name}</td>
              <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                {dateFmt.format(new Date(`${a.assessment_on}T12:00:00`))}
              </td>
              <td className="px-3 py-2 text-[var(--color-muted-foreground)]">{String(a.max_score)}</td>
              <td className="px-3 py-2 text-right align-top">
                <CohortAssessmentRowActions
                  locale={locale}
                  cohortId={cohortId}
                  sectionId={sectionId}
                  row={{
                    id: a.id,
                    name: a.name,
                    assessmentOn: a.assessment_on,
                    maxScore: Number(a.max_score) || 0,
                    createdAt: a.created_at,
                  }}
                  rubricReturnTo={null}
                  canDelete={canDelete}
                  dict={dict}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
