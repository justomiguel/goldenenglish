import type { Dictionary } from "@/types/i18n";
import { ArrowRight, CalendarClock, ChevronDown, Inbox, User } from "lucide-react";

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
    <div className="relative min-w-0 rounded-[var(--layout-border-radius)] border border-[var(--color-border)]/80 bg-[var(--color-muted)]/15 p-4 md:p-5">
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
  const hasBody = Boolean(detail.bodyHtmlDisplay.trim());

  return (
    <article className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md ring-1 ring-[var(--color-border)]/30">
      <div className="h-1 bg-[var(--color-primary)]/55" aria-hidden />

      <div className="space-y-8 p-6 md:p-8">
        <header className="border-b border-[var(--color-border)]/70 pb-6">
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-5">
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

        <section aria-labelledby="admin-portal-msg-body-heading" className="space-y-5 pt-2 md:space-y-6 md:pt-4">
          <div className="flex items-start gap-4 px-1 md:gap-5 md:px-2">
            <span
              className="mt-2 h-11 w-0.5 shrink-0 rounded-full bg-[var(--color-primary)]/45 md:h-14 md:w-1"
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-2 border-b border-[var(--color-border)]/50 pb-5 md:pb-6">
              <h2
                id="admin-portal-msg-body-heading"
                className="text-base font-semibold leading-snug text-[var(--color-secondary)] md:text-lg"
              >
                {labels.detailBodyLabel}
              </h2>
              <div className="h-px w-12 rounded-full bg-[var(--color-primary)]/35 md:w-16" aria-hidden />
            </div>
          </div>

          <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)]/85 bg-[var(--color-surface)] px-6 py-8 shadow-sm ring-1 ring-[var(--color-border)]/20 md:px-10 md:py-11">
            {hasBody ? (
              <div
                className="prose prose-sm max-w-none text-[var(--color-foreground)] md:prose-base [&_h1]:mt-8 [&_h1]:text-[var(--color-secondary)] [&_h2]:mt-8 [&_h2]:text-[var(--color-secondary)] [&_h3]:mt-6 [&_h3]:text-[var(--color-secondary)] [&_h1:first-child]:mt-0 [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0 [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:min-h-0 [&_iframe]:w-full [&_iframe]:max-w-full [&_img]:rounded-[calc(var(--layout-border-radius)-4px)] [&_img]:max-w-full [&_li]:my-1 [&_ol]:my-4 [&_p:empty]:hidden [&_p]:my-0 [&_p]:leading-relaxed [&_p+p]:mt-5 [&_table]:my-6 [&_table]:max-w-full [&_table]:text-sm [&_ul]:my-4 [&_a]:text-[var(--color-primary)] [&_blockquote]:my-6 [&_blockquote]:border-[var(--color-primary)]/35 [&_hr]:my-10 [&_hr]:border-[var(--color-border)]"
                dangerouslySetInnerHTML={{ __html: detail.bodyHtmlDisplay }}
              />
            ) : (
              <p className="py-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{labels.detailEmptyBody}</p>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}
