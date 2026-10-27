import type { Dictionary } from "@/types/i18n";
import type { AdminPortalMessageRow } from "@/types/messaging";
import Link from "next/link";
import { Globe, MessageSquare } from "lucide-react";
import { AdminMessageStatusList } from "@/components/dashboard/AdminMessageStatusList";

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

export function AdminMessageCard({
  locale,
  row,
  labels,
  detailHref,
}: AdminMessageCardProps) {
  const sourceAria =
    row.source === "contact_form" ? labels.sourceContactFormAria : labels.sourceInternalAria;
  const SourceIcon = row.source === "contact_form" ? Globe : MessageSquare;
  const isReadNeedsReply = !row.isUnread && row.needsReply;
  const attentionState = row.isUnread
    ? "unread"
    : isReadNeedsReply
      ? "read-needs-reply"
      : "handled";
  const accent = row.isUnread
    ? "border-l-[3px] border-l-[var(--color-primary)] bg-[var(--color-background)]"
    : isReadNeedsReply
      ? "border-l-[3px] border-l-amber-500 bg-amber-50/50"
      : "border-l-[3px] border-l-transparent bg-[var(--color-background)]";
  const ariaParts = [
    labels.detailOpenMessageTitle,
    sourceAria,
    row.isUnread ? labels.badgeUnread : isReadNeedsReply ? labels.badgeRead : null,
    row.needsReply ? labels.badgeNeedsReply : null,
    row.preview ? `${labels.preview}: ${row.preview}` : labels.detailEmptyBody,
  ].filter(Boolean);
  return (
    <article
      className={[
        "rounded-xl border border-[var(--color-border)] px-3 py-2.5 transition-colors",
        accent,
        "hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]/20",
      ].join(" ")}
      data-unread={row.isUnread ? "true" : "false"}
      data-needs-reply={row.needsReply ? "true" : "false"}
      data-attention-state={attentionState}
      data-source={row.source}
    >
      <Link
          href={detailHref}
          className="min-w-0 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          aria-label={ariaParts.join(". ")}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span title={sourceAria} className="inline-flex shrink-0">
              <SourceIcon
                className="h-4 w-4 text-[var(--color-muted-foreground)]"
                aria-hidden
              />
            </span>
            <span className="sr-only">{sourceAria}</span>
            <p
              className={[
                "min-w-0 truncate text-sm",
                row.isUnread
                  ? "font-semibold text-[var(--color-foreground)]"
                  : isReadNeedsReply
                    ? "font-medium text-[var(--color-foreground)]"
                    : "font-normal text-[var(--color-muted-foreground)]",
              ].join(" ")}
            >
              {row.fromName}
            </p>
            <span className="text-[var(--color-muted-foreground)]" aria-hidden>
              →
            </span>
            <p className="min-w-0 truncate text-sm text-[var(--color-muted-foreground)]">{row.toName}</p>
            {row.isUnread ? (
              <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,white)] px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--color-primary)]">
                {labels.badgeUnread}
              </span>
            ) : isReadNeedsReply ? (
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[0.65rem] font-medium text-[var(--color-muted-foreground)]">
                {labels.badgeRead}
              </span>
            ) : null}
            {row.needsReply ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-900">
                {labels.badgeNeedsReply}
              </span>
            ) : null}
            <span className="hidden rounded-full bg-sky-100 px-2.5 py-0.5 text-[0.65rem] font-semibold capitalize text-sky-800 sm:inline-flex">
              {row.fromRole}
            </span>
            <time
              dateTime={row.createdAt}
              className="ml-auto text-xs text-[var(--color-muted-foreground)]"
            >
              {formatSentAt(row.createdAt, locale)}
            </time>
          </div>
          <p
            className={[
              "mt-1 line-clamp-2 text-sm sm:truncate",
              row.isUnread || isReadNeedsReply
                ? "text-[var(--color-foreground)]/90"
                : "text-[var(--color-muted-foreground)]",
            ].join(" ")}
            title={row.preview || undefined}
          >
            {row.preview || "—"}
          </p>
          <AdminMessageStatusList locale={locale} labels={labels} lines={row.statusLines ?? []} />
      </Link>
    </article>
  );
}
