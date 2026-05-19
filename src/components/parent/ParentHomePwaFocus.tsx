"use client";

import type { ParentChildSummary } from "@/lib/parent/loadParentChildrenSummaries";
import type { ParentHomePillarSnapshot } from "@/lib/parent/buildParentHomePillarSnapshot";
import type { Dictionary } from "@/types/i18n";
import { ParentChildSwitcher } from "@/components/parent/ParentChildSwitcher";
import { ParentHomeStatusGrid } from "@/components/parent/ParentHomeStatusGrid";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export interface ParentHomePwaFocusProps {
  locale: string;
  greeting: string;
  firstName: string | null;
  summaries: ParentChildSummary[];
  selectedStudentId?: string;
  pillars: ParentHomePillarSnapshot;
  labels: Dictionary["dashboard"]["parent"];
}

export function ParentHomePwaFocus({
  locale,
  greeting,
  firstName,
  summaries,
  selectedStudentId,
  pillars,
  labels,
}: ParentHomePwaFocusProps) {
  const inbox = labels.homeInbox;
  const selected =
    summaries.find((summary) => summary.studentId === selectedStudentId) ?? summaries[0];
  const headline = firstName ? `${greeting}, ${firstName}` : greeting;
  const childName = selected
    ? formatProfileNameSurnameFirst(selected.firstName, selected.lastName)
    : null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-xl font-bold text-[var(--color-foreground)]">{headline}</h1>
        {childName ? (
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {inbox.pwaChildContext.replace("{child}", childName)}
          </p>
        ) : null}
      </header>

      <ParentChildSwitcher
        locale={locale}
        summaries={summaries}
        selectedStudentId={selected?.studentId}
        ariaLabel={labels.selectChild}
      />

      <ParentHomeStatusGrid locale={locale} pillars={pillars} labels={inbox} variant="pwa" />
    </div>
  );
}
