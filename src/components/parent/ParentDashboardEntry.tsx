"use client";

import Link from "next/link";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import type { ParentChildSummary } from "@/lib/parent/loadParentChildrenSummaries";
import type { ParentHomePillarSnapshot } from "@/lib/parent/buildParentHomePillarSnapshot";
import type { ParentHomeNewsItem } from "@/lib/parent/loadParentHomeNewsFeed";
import type { Dictionary } from "@/types/i18n";
import { ParentHomeInbox } from "@/components/parent/ParentHomeInbox";
import { ParentHomePwaFocus } from "@/components/parent/ParentHomePwaFocus";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

function ParentDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-16 rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" />
      <div className="h-28 rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" />
      <div className="h-28 rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" />
    </div>
  );
}

export interface ParentDashboardEntryProps {
  locale: string;
  lead: string;
  greeting: string;
  fullDateLine: string;
  firstName: string | null;
  navPay: string;
  payHref: string;
  kids: { id: string; first_name: string; last_name: string }[];
  summaries: ParentChildSummary[];
  selectedStudentId?: string;
  parentLabels: Dictionary["dashboard"]["parent"];
  pillars: ParentHomePillarSnapshot;
  attendanceByStudent: Record<string, number>;
  overdueByStudent: Record<string, boolean>;
  newsItems: ParentHomeNewsItem[];
  dashboardBase?: string;
  includePayments?: boolean;
}

export function ParentDashboardEntry({
  locale,
  lead,
  greeting,
  fullDateLine,
  firstName,
  navPay,
  payHref,
  kids,
  summaries,
  selectedStudentId,
  parentLabels,
  pillars,
  attendanceByStudent,
  overdueByStudent,
  newsItems,
  dashboardBase,
  includePayments = true,
}: ParentDashboardEntryProps) {
  if (summaries.length === 0 && kids.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{lead}</p>;
  }

  if (summaries.length === 0) {
    return (
      <ul className="space-y-3">
        {kids.map((kid) => (
          <li key={kid.id}>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-soft)]">
              <span className="font-medium text-[var(--color-foreground)]">
                {formatProfileNameSurnameFirst(kid.first_name, kid.last_name)}
              </span>
              <Link href={payHref} className="text-sm font-semibold text-[var(--color-primary)] underline">
                {navPay}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  const shared = {
    locale,
    greeting,
    firstName,
    summaries,
    selectedStudentId,
    pillars,
    attendanceByStudent,
    overdueByStudent,
    labels: parentLabels,
    newsItems,
    dashboardBase,
    includePayments,
  };

  return (
    <SurfaceMountGate
      skeleton={<ParentDashboardSkeleton />}
      desktop={
        <ParentHomeInbox {...shared} fullDateLine={fullDateLine} />
      }
      narrow={() => (
        <ParentHomePwaFocus {...shared} />
      )}
    />
  );
}
