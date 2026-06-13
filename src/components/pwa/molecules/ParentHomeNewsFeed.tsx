"use client";

import Link from "next/link";
import { ChevronRight, Newspaper, Ticket } from "lucide-react";
import type { ParentHomeNewsItem } from "@/lib/parent/loadParentHomeNewsFeed";
import { PwaGroupedSection } from "@/components/pwa/molecules/PwaGroupedSection";

export type ParentHomeNewsFeedLabels = {
  title: string;
  empty: string;
  typeBlog: string;
  typeEvent: string;
  seeAllBlog: string;
  seeAllEvents: string;
};

export interface ParentHomeNewsFeedProps {
  locale: string;
  items: ParentHomeNewsItem[];
  labels: ParentHomeNewsFeedLabels;
}

function NewsRow({
  item,
  labels,
}: {
  item: ParentHomeNewsItem;
  labels: ParentHomeNewsFeedLabels;
}) {
  const typeLabel = item.kind === "blog" ? labels.typeBlog : labels.typeEvent;
  const Icon = item.kind === "blog" ? Newspaper : Ticket;

  return (
    <Link
      href={item.href}
      className="flex min-h-[44px] items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0 active:bg-[var(--color-muted)]/40"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] text-[var(--color-foreground)]">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {typeLabel}
        </span>
        <span className="mt-0.5 block truncate text-sm font-medium text-[var(--color-foreground)]">
          {item.title}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">{item.dateLabel}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
    </Link>
  );
}

export function ParentHomeNewsFeed({ locale, items, labels }: ParentHomeNewsFeedProps) {
  if (items.length === 0) {
    return (
      <PwaGroupedSection title={labels.title}>
        <p className="px-4 py-4 text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p>
      </PwaGroupedSection>
    );
  }

  return (
    <PwaGroupedSection
      title={labels.title}
      footer={
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href={`/${locale}/blog`} className="font-medium text-[var(--color-primary)] underline underline-offset-2">
            {labels.seeAllBlog}
          </Link>
          <Link
            href={`/${locale}/events`}
            className="font-medium text-[var(--color-primary)] underline underline-offset-2"
          >
            {labels.seeAllEvents}
          </Link>
        </span>
      }
    >
      <ul>
        {items.map((item) => (
          <li key={`${item.kind}-${item.id}`}>
            <NewsRow item={item} labels={labels} />
          </li>
        ))}
      </ul>
    </PwaGroupedSection>
  );
}
