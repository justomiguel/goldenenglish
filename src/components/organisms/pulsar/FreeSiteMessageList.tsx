import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FREE_SITE_MESSAGE_PAGE_SIZE } from "@/lib/pulsar/freeSiteMessagePage";
import type { FreeSiteMessage } from "@/lib/pulsar/freeSiteMessages";

export function FreeSiteMessageList({
  locale,
  rows,
  total,
  page,
  siteNames,
  labels,
  pagerHref,
}: {
  locale: string;
  rows: readonly FreeSiteMessage[];
  total: number;
  page: number;
  siteNames: Readonly<Record<string, string>>;
  labels: {
    title: string;
    lead: string;
    empty: string;
    site: string;
    previous: string;
    next: string;
  };
  pagerHref: string | null;
}) {
  const pages = Math.max(1, Math.ceil(total / FREE_SITE_MESSAGE_PAGE_SIZE));
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-medium">{labels.title}</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      {rows.length === 0 ? <p className="text-sm">{labels.empty}</p> : null}
      <ul className="space-y-4">
        {rows.map((row) => (
          <li key={row.id} className="space-y-1 border-t border-[var(--color-border)] py-4">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {labels.site}: {siteNames[row.tenantSlug] ?? row.tenantSlug}
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {format.format(new Date(row.createdAt))}
            </p>
            <p className="text-base font-medium text-[var(--color-foreground)]">{row.name}</p>
            {row.phone ? <p className="text-sm">{row.phone}</p> : null}
            <p className="text-sm">{row.email}</p>
            <p className="text-sm leading-relaxed">{row.body}</p>
          </li>
        ))}
      </ul>
      {pagerHref && pages > 1 ? (
        <div className="flex gap-3">
          {page > 1 ? (
            <Link href={`${pagerHref}?page=${page - 1}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {labels.previous}
            </Link>
          ) : null}
          {page < pages ? (
            <Link href={`${pagerHref}?page=${page + 1}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
              <ChevronRight className="h-4 w-4" aria-hidden />
              {labels.next}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
