"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { ParentTodayFeed } from "@/lib/parent/buildParentTodayFeed";
import type { ParentHomeNewsItem } from "@/lib/parent/loadParentHomeNewsFeed";
import { ParentTodayCards } from "@/components/parent/ParentTodayCards";
import { ParentHomeNewsFeed } from "@/components/pwa/molecules/ParentHomeNewsFeed";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

type TodayCopy = Dictionary["dashboard"]["parent"]["today"];

export interface ParentTodayChildPulse {
  displayName: string;
  sectionLabel: string;
  attendancePercent: number | null;
}

export interface ParentTodayScreenProps {
  locale: string;
  greeting: string;
  fullDateLine: string;
  feed: ParentTodayFeed;
  copy: TodayCopy;
  child: ParentTodayChildPulse | null;
  childHref: string;
  calendarHref: string;
  scheduleHuman: string | null;
  newsItems: ParentHomeNewsItem[];
  newsLabels: Dictionary["dashboard"]["parent"]["homeInbox"]["newsFeed"];
}

function Header({ greeting, fullDateLine }: { greeting: string; fullDateLine: string }) {
  return (
    <header className="space-y-0.5" data-tour={PARENT_TOUR_ANCHORS.homeTitle}>
      <h1 className="font-display text-xl font-bold text-[var(--color-foreground)] md:text-2xl">
        {greeting}
      </h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">{fullDateLine}</p>
    </header>
  );
}

function ChildPulseRow({
  child,
  childHref,
  copy,
}: {
  child: ParentTodayChildPulse;
  childHref: string;
  copy: TodayCopy;
}) {
  return (
    <Link
      href={childHref}
      className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
    >
      <span className="min-w-0">
        <span className="block text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {copy.childPulseTitle}
        </span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-[var(--color-foreground)]">
          {child.displayName}
        </span>
        <span className="block truncate text-xs text-[var(--color-muted-foreground)]">
          {child.sectionLabel}
          {child.attendancePercent !== null ? ` · ${child.attendancePercent}%` : ""}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
    </Link>
  );
}

function NextClassRow({
  calendarHref,
  scheduleHuman,
  copy,
}: {
  calendarHref: string;
  scheduleHuman: string | null;
  copy: TodayCopy;
}) {
  return (
    <Link
      href={calendarHref}
      className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
    >
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {copy.nextClassTitle}
        </span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-[var(--color-foreground)]">
          {scheduleHuman ?? copy.nextClassEmpty}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
    </Link>
  );
}

export function ParentTodayScreen(props: ParentTodayScreenProps) {
  const {
    locale,
    greeting,
    fullDateLine,
    feed,
    copy,
    child,
    childHref,
    calendarHref,
    scheduleHuman,
    newsItems,
    newsLabels,
  } = props;

  const cards = (
    <div data-tour={PARENT_TOUR_ANCHORS.homeStatusPillars}>
      <ParentTodayCards feed={feed} copy={copy} />
    </div>
  );
  const pulse = child ? <ChildPulseRow child={child} childHref={childHref} copy={copy} /> : null;
  const nextClass = (
    <NextClassRow calendarHref={calendarHref} scheduleHuman={scheduleHuman} copy={copy} />
  );
  const news = <ParentHomeNewsFeed locale={locale} items={newsItems} labels={newsLabels} />;

  // Desktop reads left to right: what needs you, then the calmer context column.
  const desktop = (
    <div className="grid grid-cols-[minmax(0,1fr)_22rem] items-start gap-6">
      <div className="space-y-4">
        <Header greeting={greeting} fullDateLine={fullDateLine} />
        {cards}
      </div>
      <div className="space-y-3" data-tour={PARENT_TOUR_ANCHORS.homeInbox}>
        {pulse}
        {nextClass}
        {news}
      </div>
    </div>
  );

  // One thumb, one column: alerts sit above the fold, context is a scroll away.
  const narrow = (
    <div className="space-y-4">
      <Header greeting={greeting} fullDateLine={fullDateLine} />
      {cards}
      <div className="space-y-3" data-tour={PARENT_TOUR_ANCHORS.homeInbox}>
        {pulse}
        {nextClass}
        {news}
      </div>
    </div>
  );

  return (
    <SurfaceMountGate
      skeleton={
        <div className="space-y-4">
          <Header greeting={greeting} fullDateLine={fullDateLine} />
          <div className="h-40 animate-pulse rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" />
        </div>
      }
      desktop={desktop}
      narrow={() => narrow}
    />
  );
}
