"use client";

import { AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import type { FinanceSectionRanked } from "@/types/financeAnalytics";
import type { Dictionary } from "@/types/i18n";

type AlertDict = Dictionary["admin"]["finance"]["insights"]["alerts"];

export interface FinanceSectionAlertsListProps {
  ranked: FinanceSectionRanked[];
  labels: AlertDict;
}

export function FinanceSectionAlertsList({
  ranked,
  labels,
}: FinanceSectionAlertsListProps) {
  const critical = ranked.filter((r) => r.health === "critical");
  const watch = ranked.filter((r) => r.health === "watch");

  if (critical.length === 0 && watch.length === 0) {
    return (
      <section className="flex items-center gap-3 rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-5 text-sm text-[var(--color-primary)]">
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
        {labels.allHealthy}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h3 className="font-semibold text-[var(--color-primary)]">
        {labels.title}
      </h3>

      {critical.length > 0 && (
        <AlertGroup
          title={labels.critical}
          sections={critical}
          borderColor="border-l-[var(--color-error)]"
          icon={<AlertTriangle className="h-4 w-4 text-[var(--color-error)]" aria-hidden />}
          labels={labels}
        />
      )}

      {watch.length > 0 && (
        <AlertGroup
          title={labels.watch}
          sections={watch}
          borderColor="border-l-[var(--color-accent)]"
          icon={<Eye className="h-4 w-4 text-[var(--color-accent)]" aria-hidden />}
          labels={labels}
        />
      )}
    </section>
  );
}

function AlertGroup({
  title,
  sections,
  borderColor,
  icon,
  labels,
}: {
  title: string;
  sections: FinanceSectionRanked[];
  borderColor: string;
  icon: React.ReactNode;
  labels: AlertDict;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
        {icon}
        {title} ({sections.length})
      </div>
      <ul className="space-y-2">
        {sections.map((sec) => (
          <li
            key={sec.sectionId}
            className={`rounded-[var(--layout-border-radius)] border border-[var(--color-border)] ${borderColor} border-l-4 bg-[var(--color-surface)] px-4 py-3`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-foreground)]">
                {sec.sectionName}
              </span>
              <span className="text-sm tabular-nums text-[var(--color-muted-foreground)]">
                {labels.ratio} {Math.round(sec.collectionRatio * 100)}%
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              {sec.overdueStudents} {labels.overdueStudents}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
