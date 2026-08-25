import type { Dictionary } from "@/types/i18n";
import type { AdminPortalMessageRow } from "@/types/messaging";
import Link from "next/link";
import { Globe, MessageSquare, Reply, ReplyAll } from "lucide-react";
import { DeletePortalMessageButton } from "@/components/dashboard/DeletePortalMessageButton";
import { AdminMessageReadToggleButton } from "@/components/dashboard/AdminMessageReadToggleButton";

interface AdminMessageCardProps {
  locale: string;
  row: AdminPortalMessageRow;
  labels: Dictionary["admin"]["messages"];
  detailHref: string;
  /** Sent folder: hide unread toggle. */
  showReadToggle?: boolean;
  /** When set, shows a leading selection checkbox. */
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  selectionDisabled?: boolean;
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
  showReadToggle = true,
  selected,
  onSelectedChange,
  selectionDisabled = false,
}: AdminMessageCardProps) {
  const selectionEnabled = typeof selected === "boolean" && onSelectedChange;
  const sourceAria =
    row.source === "contact_form" ? labels.sourceContactFormAria : labels.sourceInternalAria;
  const SourceIcon = row.source === "contact_form" ? Globe : MessageSquare;
  const accent =
    row.isUnread || row.needsReply
      ? "border-l-[3px] border-l-[var(--color-primary)]"
      : "border-l-[3px] border-l-transparent";
  const ariaParts = [
    labels.detailOpenMessageTitle,
    sourceAria,
    row.isUnread ? labels.badgeUnread : null,
    row.needsReply ? labels.badgeNeedsReply : null,
    row.preview ? `${labels.preview}: ${row.preview}` : labels.detailEmptyBody,
  ].filter(Boolean);
  const replyHref = `/${locale}/dashboard/admin/messages/compose?replyTo=${row.id}`;
  const replyWithDefaultHref = `${replyHref}&useDefault=1`;

  return (
    <article
      className={[
        "flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-3 transition-colors sm:flex-row sm:items-center sm:gap-3",
        accent,
        "hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]/20",
      ].join(" ")}
      data-unread={row.isUnread ? "true" : "false"}
      data-needs-reply={row.needsReply ? "true" : "false"}
      data-source={row.source}
      data-selected={selectionEnabled && selected ? "true" : "false"}
    >
      {selectionEnabled ? (
        <div className="flex shrink-0 items-start pt-0.5 sm:items-center sm:pt-0">
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 cursor-pointer rounded border-[var(--color-border)] text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            checked={selected}
            disabled={selectionDisabled}
            aria-label={labels.bulkSelectRowAria.replace("{{from}}", row.fromName)}
            onChange={(e) => onSelectedChange(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
      <Link
        href={detailHref}
        className="min-w-0 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        aria-label={ariaParts.join(". ")}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
          <span title={sourceAria} className="inline-flex shrink-0">
            <SourceIcon
              className="h-4 w-4 text-[var(--color-muted-foreground)]"
              aria-hidden
            />
          </span>
          <span className="sr-only">{sourceAria}</span>
          <p
            className={[
              "min-w-0 truncate text-sm text-[var(--color-foreground)]",
              row.isUnread ? "font-semibold" : "font-normal",
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
          ) : null}
          {row.needsReply ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-800">
              {labels.badgeNeedsReply}
            </span>
          ) : null}
          <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-[0.65rem] font-semibold capitalize text-sky-800">
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
            "mt-1 truncate text-sm",
            row.isUnread
              ? "text-[var(--color-foreground)]/90"
              : "text-[var(--color-muted-foreground)]",
          ].join(" ")}
          title={row.preview || undefined}
        >
          {row.preview || "—"}
        </p>
      </Link>
      <div className="flex shrink-0 items-center justify-end gap-1.5">
        {showReadToggle ? (
          <AdminMessageReadToggleButton
            locale={locale}
            messageId={row.id}
            isUnread={row.isUnread}
            labels={labels}
          />
        ) : null}
        <Link
          href={replyHref}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          title={labels.replyToMessageTitle}
          aria-label={labels.replyToMessage}
        >
          <Reply className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{labels.replyToMessage}</span>
        </Link>
        <Link
          href={replyWithDefaultHref}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          title={labels.replyWithDefaultMessageTitle}
          aria-label={labels.replyWithDefaultMessage}
        >
          <ReplyAll className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden lg:inline">{labels.replyWithDefaultMessage}</span>
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
