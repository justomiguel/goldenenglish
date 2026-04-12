import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

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
  };
  recentCount: number;
  latestPreview: LatestPreview | null;
  locale: string;
}

export function AdminHubMessagesCard({
  href,
  labels,
  recentCount,
  latestPreview,
  locale,
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
      className={`group relative flex flex-col rounded-[var(--layout-border-radius)] border bg-[var(--color-background)] p-5 shadow-sm transition hover:shadow-md sm:col-span-2 lg:col-span-2 ${
        hasRecent
          ? "border-violet-300 ring-1 ring-violet-200"
          : "border-[var(--color-border)]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
            hasRecent ? "bg-violet-50 text-violet-600" : "bg-emerald-50 text-emerald-600"
          }`}
        >
          <MessageCircle className="h-5 w-5" />
        </span>
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
          {labels.title}
        </h3>
        {hasRecent && (
          <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[0.65rem] font-bold text-white">
            {recentCount > 99 ? "99+" : recentCount} {labels.recent}
          </span>
        )}
      </div>

      <div className="mt-3 flex-1">
        {hasRecent && latestPreview ? (
          <div className="rounded-lg bg-[var(--color-muted)]/60 px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--color-foreground)]">
                {labels.from} {latestPreview.fromName}
              </span>
              <time className="shrink-0 text-[0.65rem] text-[var(--color-muted-foreground)]">
                {timeStr}
              </time>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted-foreground)]">
              {latestPreview.preview}
            </p>
          </div>
        ) : (
          <p className="text-sm text-emerald-600">{labels.noRecent}</p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] opacity-0 transition group-hover:opacity-100">
        <span>{labels.viewAll}</span>
        <ArrowRight className="h-3 w-3" aria-hidden />
      </div>
    </Link>
  );
}
