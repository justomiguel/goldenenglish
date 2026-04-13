"use client";

import type { Dictionary } from "@/types/i18n";
import type { StudentHubPublishedGrade } from "@/types/studentHub";
import { StudentGradeRadar } from "@/components/student/StudentGradeRadar";

export interface StudentPublishedGradesSectionProps {
  locale: string;
  grades: StudentHubPublishedGrade[];
  dict: Dictionary["dashboard"]["student"]["grades"];
}

export function StudentPublishedGradesSection({ locale, grades, dict }: StudentPublishedGradesSectionProps) {
  const df = new Intl.DateTimeFormat(locale === "es" ? "es" : "en", { dateStyle: "medium" });

  if (!grades.length) {
    return (
      <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">{dict.title}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">{dict.title}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{dict.lead}</p>
      </div>
      <ul className="space-y-6">
        {grades.map((g) => {
          const dateLabel = dict.assessmentDate.replace("{date}", df.format(new Date(`${g.assessmentOn}T12:00:00`)));
          const scoreLine = dict.scoreLine.replace("{score}", String(g.score)).replace("{max}", String(g.maxScore));
          const radarAria = dict.radarAria.replace("{assessment}", g.assessmentName);
          return (
            <li
              key={`${g.enrollmentId}-${g.assessmentId}`}
              className="border-t border-[var(--color-border)] pt-4 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="font-medium text-[var(--color-foreground)]">{g.assessmentName}</h3>
                <span className="text-xs text-[var(--color-muted-foreground)]">{g.sectionName}</span>
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)]">{dateLabel}</p>
              <p className="mt-2 text-sm text-[var(--color-foreground)]">{scoreLine}</p>
              <StudentGradeRadar title={dict.rubricChartTitle} ariaLabel={radarAria} points={g.radarPoints} />
              {g.radarPoints.length < 3 ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium text-[var(--color-foreground)]">{dict.listFallbackTitle}</p>
                  <ul className="list-inside list-disc text-sm text-[var(--color-muted-foreground)]">
                    {Object.entries(g.rubricData).map(([k, v]) => (
                      <li key={k}>
                        {g.rubricLabels[k] ?? k}: {v}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {g.teacherFeedback?.trim() ? (
                <div className="mt-3">
                  <p className="text-sm font-medium text-[var(--color-foreground)]">{dict.feedbackHeading}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-muted-foreground)]">{g.teacherFeedback}</p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
