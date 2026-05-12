import type { Dictionary } from "@/types/i18n";
import type { AdminPortalMessageRow } from "@/types/messaging";
import Link from "next/link";
import { ArrowRight, CalendarClock, ChevronRight, Reply } from "lucide-react";
import { DeletePortalMessageButton } from "@/components/dashboard/DeletePortalMessageButton";

interface AdminMessageCardProps {
  locale: string;
  row: AdminPortalMessageRow;
  labels: Dictionary["admin"]["messages"];
  detailHref: string;
}

function formatSentAt(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function AdminMessageCard({ locale, row, labels, detailHref }: AdminMessageCardProps) {
  const aria =
    `${labels.detailOpenMessageTitle}. ${row.preview ? `${labels.preview}: ${row.preview}` : labels.detailEmptyBody}`;
  const replyHref = `/${locale}/dashboard/admin/messages/compose?replyTo=${row.id}`;

  return (
    <article className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-[box-shadow,transform] hover:border-[var(--color-primary)]/35 hover:shadow-md">
      <Link
        href={detailHref}
        className="block outline-none ring-offset-2 ring-[var(--color-primary)] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-label={aria}
      >
        <div className="p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)]/80 pb-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              <CalendarClock className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              <time dateTime={row.createdAt}>{formatSentAt(row.createdAt, locale)}</time>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex flex-wrap justify-end gap-1.5">
                <span className="rounded-full bg-[var(--color-muted)]/80 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  {row.fromRole}
                </span>
                <span className="rounded-full bg-[var(--color-muted)]/50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  {row.toRole}
                </span>
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] opacity-70"
                aria-hidden
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                {labels.colFrom}
              </p>
              <p className="truncate text-base font-semibold text-[var(--color-foreground)]">{row.fromName}</p>
            </div>
            <ArrowRight
              className="hidden h-4 w-4 shrink-0 text-[var(--color-primary)] opacity-70 sm:block"
              aria-hidden
            />
            <div className="min-w-0 flex-1 sm:text-end">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                {labels.colTo}
              </p>
              <p className="truncate text-base font-semibold text-[var(--color-foreground)]">{row.toName}</p>
            </div>
          </div>

          <div className="mt-4 rounded-[calc(var(--layout-border-radius)-2px)] bg-[var(--color-muted)]/25 px-3 py-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              {labels.preview}
            </p>
            <p
              className="mt-1 line-clamp-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]"
              title={row.preview ? row.preview : undefined}
            >
              {row.preview || "—"}
            </p>
          </div>
        </div>
      </Link>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)]/80 bg-[var(--color-muted)]/10 px-4 py-3">
        <Link
          href={replyHref}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          title={labels.replyToMessageTitle}
        >
          <Reply className="h-4 w-4 shrink-0" aria-hidden />
          {labels.replyToMessage}
        </Link>
        <DeletePortalMessageButton
          locale={locale}
          messageId={row.id}
          labels={labels}
          confirmSnippet={row.preview || undefined}
          navigateAfterDelete="refresh"
        />
      </div>
    </article>
  );
}
