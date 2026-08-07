import type { ParentChildSummary } from "@/lib/parent/loadParentChildrenSummaries";
import type { ParentHomePillarSnapshot } from "@/lib/parent/buildParentHomePillarSnapshot";
import type { ParentHomeNewsItem } from "@/lib/parent/loadParentHomeNewsFeed";
import type { Dictionary } from "@/types/i18n";
import { ParentChildSwitcher } from "@/components/parent/ParentChildSwitcher";
import { ParentHomeStatusGrid } from "@/components/parent/ParentHomeStatusGrid";
import { ParentHomeNewsFeed } from "@/components/pwa/molecules/ParentHomeNewsFeed";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

export interface ParentHomeInboxProps {
  locale: string;
  greeting: string;
  firstName: string | null;
  fullDateLine: string;
  summaries: ParentChildSummary[];
  selectedStudentId?: string;
  pillars: ParentHomePillarSnapshot;
  labels: Dictionary["dashboard"]["parent"];
  newsItems: ParentHomeNewsItem[];
  dashboardBase?: string;
  includePayments?: boolean;
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
  newsItems = [],
  dashboardBase,
  includePayments = true,
}: ParentHomeInboxProps) {
  const inbox = labels.homeInbox;
  const headline = firstName ? `${greeting}, ${firstName}` : greeting;
  const selected =
    summaries.find((summary) => summary.studentId === selectedStudentId) ?? summaries[0];
  const multipleChildren = summaries.length > 1;
  const childName = selected
    ? formatProfileNameSurnameFirst(selected.firstName, selected.lastName)
    : null;

  return (
    <div className="space-y-5">
      <header data-tour={PARENT_TOUR_ANCHORS.homeTitle}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)]">
          {labels.kicker}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          {headline}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{fullDateLine}</p>
        {multipleChildren ? (
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{inbox.pwaFamilyContext}</p>
        ) : childName ? (
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {inbox.pwaChildContext.replace("{child}", childName)}
          </p>
        ) : null}
      </header>

      <div data-tour={PARENT_TOUR_ANCHORS.homeChildSwitcher}>
        <ParentChildSwitcher
          locale={locale}
          summaries={summaries}
          selectedStudentId={selected?.studentId}
          ariaLabel={labels.selectChild}
          dashboardBase={dashboardBase}
        />
      </div>

      <div data-tour={PARENT_TOUR_ANCHORS.homeStatusPillars}>
        <ParentHomeStatusGrid
          locale={locale}
          pillars={pillars}
          labels={inbox}
          dashboardBase={dashboardBase}
          includePayments={includePayments}
        />
      </div>

      <div data-tour={PARENT_TOUR_ANCHORS.homeInbox}>
        <ParentHomeNewsFeed locale={locale} items={newsItems} labels={inbox.newsFeed} />
      </div>
    </div>
  );
}
