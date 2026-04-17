import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AcademicCohortCurrentToggle } from "@/components/molecules/AcademicCohortCurrentToggle";

export type AcademicHubCohortSummary = {
  id: string;
  name: string;
  is_current: boolean;
  archived_at: string | null;
};

export interface AcademicHubCohortRowLabels {
  currentBadge: string;
  statusActive: string;
  setAsCurrent: string;
  open: string;
  archivedBadge: string;
  openCohortTitle: string;
}

export interface AcademicHubCohortRowProps {
  c: AcademicHubCohortSummary;
  locale: string;
  labels: AcademicHubCohortRowLabels;
  isCurrent?: boolean;
}

export function AcademicHubCohortRow({ c, locale, labels, isCurrent }: AcademicHubCohortRowProps) {
  const isArchived = c.archived_at != null;
  const showSetCurrent = !isCurrent && !isArchived;

  return (
    <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[var(--color-foreground)]">{c.name}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isCurrent
              ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
              : "bg-[var(--color-accent)]/20 text-[var(--color-foreground)]"
          }`}
        >
          {isCurrent ? labels.currentBadge : labels.statusActive}
        </span>
        {isArchived ? (
          <span className="inline-flex rounded-full bg-[var(--color-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]">
            {labels.archivedBadge}
          </span>
        ) : null}
        {showSetCurrent ? (
          <AcademicCohortCurrentToggle cohortId={c.id} locale={locale} label={labels.setAsCurrent} showIcon />
        ) : null}
        <Link
          href={`/${locale}/dashboard/admin/academic/${c.id}`}
          title={`${labels.openCohortTitle}: ${c.name}`}
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
        >
          <span>{labels.open}</span>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
