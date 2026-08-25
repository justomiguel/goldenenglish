import Link from "next/link";
import { ArrowRight, MessageCircle, Send } from "lucide-react";
import {
  ADMIN_HUB_CARD_RELIEF,
  ADMIN_HUB_CARD_RELIEF_HOVER,
} from "@/lib/dashboard/adminHubCardRelief";

interface LatestPreview {
  fromName: string;
  preview: string;
  createdAt: string;
}

interface AdminHubMessagesCardProps {
  href: string;
  labels: {
    title: string;
    recent: string;
    noRecent: string;
    from: string;
    viewAll: string;
    previewHint?: string;
  };
  recentCount: number;
  latestPreview: LatestPreview | null;
  locale: string;
  cardTip?: string;
  tourAnchor?: string;
}

export function AdminHubMessagesCard({
  href,
  labels,
  recentCount,
  latestPreview,
  locale,
  cardTip,
  tourAnchor,
}: AdminHubMessagesCardProps) {
  const hasRecent = recentCount > 0;
  const timeStr = latestPreview
    ? new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(latestPreview.createdAt))
    : "";

  return (
    <Link
      href={href}
      title={cardTip}
      {...(tourAnchor ? { "data-tour": tourAnchor } : {})}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border p-6 ${ADMIN_HUB_CARD_RELIEF} ${ADMIN_HUB_CARD_RELIEF_HOVER} ${
        hasRecent
          ? "border-violet-300 ring-1 ring-violet-200"
          : "border-[var(--color-border)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
            hasRecent
              ? "bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-[var(--color-primary)]"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          <MessageCircle className="h-6 w-6" />
        </span>
        <h3 className="text-base font-semibold text-[var(--color-foreground)]">
          {labels.title}
        </h3>
      </div>

      <div className="mt-4 flex-1">
        <p
          className={`text-4xl font-bold ${
            hasRecent ? "text-[var(--color-primary)]" : "text-[var(--color-foreground)]"
          }`}
        >
          {recentCount}
        </p>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {hasRecent ? labels.recent : labels.noRecent}
        </p>
        {hasRecent && latestPreview ? (
          <div className="mt-3 rounded-lg bg-[var(--color-muted)]/60 px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--color-foreground)]">
                {labels.from} {latestPreview.fromName}
              </span>
              <time className="shrink-0 text-[0.65rem] text-[var(--color-muted-foreground)]">
                {timeStr}
              </time>
            </div>
            <p
              className="mt-1 line-clamp-2 text-xs text-[var(--color-muted-foreground)]"
              title={labels.previewHint}
            >
              {latestPreview.preview}
            </p>
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none mt-3 flex justify-end" aria-hidden>
        <Send className={`h-14 w-14 ${hasRecent ? "text-violet-300" : "text-emerald-300"}`} strokeWidth={1.25} />
      </div>

      <div className="mt-2 flex items-center gap-1 text-sm font-medium text-[var(--color-primary)]">
        <span>{labels.viewAll}</span>
        <ArrowRight className="h-4 w-4" aria-hidden />
      </div>
    </Link>
  );
}
