import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminMessageStatusList } from "@/components/dashboard/AdminMessageStatusList";
import type { AdminMessageStatusLine } from "@/lib/messaging/adminMessageStatus";
import type { Dictionary } from "@/types/i18n";
import { ArrowRight, CalendarClock, ChevronDown, Inbox, MessageSquareText, User } from "lucide-react";

const FIRST_HR = /<hr\b[^>]*>/i;

function splitContactMetaAndBodyHtml(rawHtml: string): {
  contactMetaHtml: string | null;
  mainBodyHtml: string;
} {
  const trimmed = rawHtml.trim();
  if (!trimmed) {
    return { contactMetaHtml: null, mainBodyHtml: "" };
  }
  const segments = trimmed.split(FIRST_HR);
  if (segments.length > 1) {
    const meta = segments[0]?.trim() ?? "";
    const body = segments.slice(1).join("<hr />").trim();
    if (meta && body) {
      return { contactMetaHtml: meta, mainBodyHtml: body };
    }
  }
  return { contactMetaHtml: null, mainBodyHtml: trimmed };
}

interface AdminPortalMessageDetailViewProps {
  locale: string;
  labels: Dictionary["admin"]["messages"];
  detail: {
    createdAt: string;
    bodyHtmlDisplay: string;
    previewSnippet?: string;
    fromName: string;
    toName: string;
    fromRoleLabel: string;
    toRoleLabel: string;
    statusLines?: AdminMessageStatusLine[];
  };
}

function formatSentAt(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function ParticipantPanel(props: {
  kind: "from" | "to";
  labels: Dictionary["admin"]["messages"];
  name: string;
  roleLabel: string;
}) {
  const icon =
    props.kind === "from" ? (
      <User className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
    ) : (
      <Inbox className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
    );
  const heading = props.kind === "from" ? props.labels.colFrom : props.labels.colTo;

  return (
    <div className="relative min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 md:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[calc(var(--layout-border-radius)-2px)] bg-[var(--color-surface)] shadow-sm ring-1 ring-[var(--color-border)]/60">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
            {heading}
          </p>
          <p className="mt-1.5 truncate text-lg font-semibold leading-snug text-[var(--color-foreground)] md:text-xl">
            {props.name}
          </p>
          <p className="mt-2 inline-flex max-w-full items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {props.roleLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AdminPortalMessageDetailView({
  locale,
  labels,
  detail,
}: AdminPortalMessageDetailViewProps) {
  const { contactMetaHtml, mainBodyHtml } = splitContactMetaAndBodyHtml(detail.bodyHtmlDisplay);
  const hasBody = Boolean(mainBodyHtml.trim());

  return (
    <article className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)] md:rounded-2xl">
      <div className="h-0.5 bg-[var(--color-primary)]/55 md:h-1" aria-hidden />

      <div className="space-y-3 p-3.5 md:space-y-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-[var(--color-border)]/60 pb-2.5 md:hidden">
          <p className="min-w-0 text-xs font-medium text-[var(--color-foreground)]">
            {detail.fromName} → {detail.toName} · {formatSentAt(detail.createdAt, locale)}
          </p>
          <span className="inline-flex shrink-0 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {detail.fromRoleLabel}
          </span>
        </div>
        <header className="hidden border-b border-[var(--color-border)]/70 pb-6 md:block">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[calc(var(--layout-border-radius)-2px)] bg-[var(--color-muted)]/40 text-[var(--color-primary)]">
              <CalendarClock className="h-4 w-4" aria-hidden />
            </span>
            <time
              dateTime={detail.createdAt}
              className="font-medium text-[var(--color-foreground)]"
              title={detail.createdAt}
            >
              {formatSentAt(detail.createdAt, locale)}
            </time>
          </div>
        </header>

        <div
          className="hidden flex-col gap-4 md:flex md:flex-row md:items-stretch md:gap-5"
          data-tour={ADMIN_TOUR_ANCHORS.messagesDetailParticipants}
        >
          <div className="min-w-0 flex-1">
            <ParticipantPanel kind="from" labels={labels} name={detail.fromName} roleLabel={detail.fromRoleLabel} />
          </div>

          <div
            className="flex shrink-0 items-center justify-center text-[var(--color-primary)] sm:flex-col sm:justify-center sm:px-1"
            aria-hidden
          >
            <ChevronDown className="h-5 w-5 opacity-70 sm:hidden" />
            <ArrowRight className="hidden h-5 w-5 opacity-80 sm:block" />
          </div>

          <div className="min-w-0 flex-1">
            <ParticipantPanel kind="to" labels={labels} name={detail.toName} roleLabel={detail.toRoleLabel} />
          </div>
        </div>

        <AdminMessageStatusList
          locale={locale}
          labels={labels}
          lines={detail.statusLines ?? []}
          showHtml
        />

        {contactMetaHtml ? (
          <div
            data-testid="admin-portal-msg-contact-meta"
            className="rounded-lg border border-[var(--color-border)]/70 bg-[var(--color-muted)]/20 px-3 py-2 text-xs leading-snug text-[var(--color-muted-foreground)] [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_strong]:text-[var(--color-foreground)]"
            dangerouslySetInnerHTML={{ __html: contactMetaHtml }}
          />
        ) : null}

        <section
          aria-labelledby="admin-portal-msg-body-heading"
          className="space-y-2 pt-0.5 md:space-y-3 md:pt-2"
          data-tour={ADMIN_TOUR_ANCHORS.messagesDetailBody}
        >
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
            <h2
              id="admin-portal-msg-body-heading"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] md:text-sm"
            >
              {labels.detailBodyLabel}
            </h2>
          </div>

          <div
            data-testid="admin-portal-msg-body-box"
            className="rounded-xl border border-[var(--color-border)] border-l-4 border-l-[var(--color-primary)] bg-[var(--color-surface)]/55 px-4 py-3.5 md:rounded-2xl md:px-8 md:py-7"
          >
            {hasBody ? (
              <div
                className="prose prose-sm max-w-none text-base leading-relaxed text-[var(--color-foreground)] md:prose-base [&_h1]:mt-4 md:[&_h1]:mt-8 [&_h1]:text-[var(--color-secondary)] [&_h2]:mt-4 md:[&_h2]:mt-8 [&_h2]:text-[var(--color-secondary)] [&_h3]:mt-3 md:[&_h3]:mt-6 [&_h3]:text-[var(--color-secondary)] [&_h1:first-child]:mt-0 [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0 [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:min-h-0 [&_iframe]:w-full [&_iframe]:max-w-full [&_img]:rounded-[calc(var(--layout-border-radius)-4px)] [&_img]:max-w-full [&_li]:my-1 [&_ol]:my-3 md:[&_ol]:my-4 [&_p:empty]:hidden [&_p]:my-0 [&_p]:leading-relaxed [&_p+p]:mt-2.5 md:[&_p+p]:mt-4 [&_table]:my-4 md:[&_table]:my-6 [&_table]:max-w-full [&_table]:text-sm [&_ul]:my-3 md:[&_ul]:my-4 [&_a]:text-[var(--color-primary)] [&_blockquote]:my-3 md:[&_blockquote]:my-6 [&_blockquote]:border-[var(--color-primary)]/35 [&_hr]:my-3 md:[&_hr]:my-6 [&_hr]:border-[var(--color-border)]"
                dangerouslySetInnerHTML={{ __html: mainBodyHtml }}
              />
            ) : (
              <p className="py-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{labels.detailEmptyBody}</p>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}
