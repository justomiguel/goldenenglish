import type { ParentChildSummary } from "@/lib/parent/loadParentChildrenSummaries";
import type { ParentHomePillarSnapshot } from "@/lib/parent/buildParentHomePillarSnapshot";
import type { Dictionary } from "@/types/i18n";
import { ParentChildSwitcher } from "@/components/parent/ParentChildSwitcher";
import { ParentHomeStatusGrid } from "@/components/parent/ParentHomeStatusGrid";

export interface ParentHomeInboxProps {
  locale: string;
  greeting: string;
  firstName: string | null;
  fullDateLine: string;
  summaries: ParentChildSummary[];
  selectedStudentId?: string;
  pillars: ParentHomePillarSnapshot;
  labels: Dictionary["dashboard"]["parent"];
}

export function ParentHomeInbox({
  locale,
  greeting,
  firstName,
  fullDateLine,
  summaries,
  selectedStudentId,
  pillars,
  labels,
}: ParentHomeInboxProps) {
  const inbox = labels.homeInbox;
  const headline = firstName ? `${greeting}, ${firstName}` : greeting;
  const selected =
    summaries.find((summary) => summary.studentId === selectedStudentId) ?? summaries[0];

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)]">
          {labels.kicker}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          {headline}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{fullDateLine}</p>
      </header>

      <ParentChildSwitcher
        locale={locale}
        summaries={summaries}
        selectedStudentId={selected?.studentId}
        ariaLabel={labels.selectChild}
      />

      <ParentHomeStatusGrid locale={locale} pillars={pillars} labels={inbox} />
    </div>
  );
}
