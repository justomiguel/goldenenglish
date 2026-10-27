import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
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
      className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3 ${ADMIN_HUB_CARD_RELIEF} ${ADMIN_HUB_CARD_RELIEF_HOVER} ${
        hasRecent
          ? "border-violet-300 ring-1 ring-violet-200"
          : "border-[var(--color-border)]"
      }`}
    >
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          hasRecent
            ? "bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-[var(--color-primary)]"
            : "bg-emerald-50 text-emerald-600"
        }`}
      >
        <MessageCircle className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-[var(--color-foreground)]">
          {labels.title}
        </h3>
        <p className="mt-0.5">
          <span
            className={`text-2xl font-bold ${
              hasRecent ? "text-[var(--color-primary)]" : "text-[var(--color-foreground)]"
            }`}
          >
            {recentCount}
          </span>
          <span className="ms-2 text-xs text-[var(--color-muted-foreground)]">
            {hasRecent ? labels.recent : labels.noRecent}
          </span>
        </p>
        {hasRecent && latestPreview ? (
          <p className="mt-0.5 truncate text-xs text-[var(--color-muted-foreground)]" title={labels.previewHint}>
            <span className="font-semibold text-[var(--color-foreground)]">
              {labels.from} {latestPreview.fromName}
            </span>
            <time className="ms-2 text-[0.65rem]">{timeStr}</time>
            <span className="ms-2">{latestPreview.preview}</span>
          </p>
        ) : null}
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-[var(--color-primary)]">
        <span>{labels.viewAll}</span>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </Link>
  );
}
