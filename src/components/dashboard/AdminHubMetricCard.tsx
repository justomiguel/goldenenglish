import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  ADMIN_HUB_CARD_RELIEF,
  ADMIN_HUB_CARD_RELIEF_HOVER,
} from "@/lib/dashboard/adminHubCardRelief";

interface AdminHubMetricCardProps {
  href: string;
  icon: ReactNode;
  title: string;
  accentClass: string;
  children: ReactNode;
  linkLabel?: string;
  urgent?: boolean;
  hint?: string;
  tourAnchor?: string;
  rangeLabel?: string;
  illustration?: ReactNode;
  className?: string;
}

export function AdminHubMetricCard({
  href,
  icon,
  title,
  accentClass,
  children,
  linkLabel,
  urgent,
  hint,
  tourAnchor,
  rangeLabel,
  illustration,
  className,
}: AdminHubMetricCardProps) {
  return (
    <Link
      href={href}
      title={hint}
      {...(tourAnchor ? { "data-tour": tourAnchor } : {})}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border p-6 ${ADMIN_HUB_CARD_RELIEF} ${ADMIN_HUB_CARD_RELIEF_HOVER} ${
        urgent
          ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/35"
          : "border-[var(--color-border)]"
      } ${className ?? ""}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accentClass}`}
        >
          {icon}
        </span>
        <h3 className="min-w-0 flex-1 text-base font-semibold text-[var(--color-foreground)]">
          {title}
        </h3>
        {rangeLabel ? (
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2.5 py-1 text-[0.65rem] font-semibold text-[var(--color-muted-foreground)]">
            {rangeLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex-1">{children}</div>

      {illustration ? (
        <div className="pointer-events-none mt-3 flex justify-end text-[var(--color-muted-foreground)]" aria-hidden>
          {illustration}
        </div>
      ) : null}

      {linkLabel ? (
        <div className="mt-3 flex items-center gap-1 text-sm font-medium text-[var(--color-primary)]">
          <span>{linkLabel}</span>
          <ArrowRight className="h-4 w-4" aria-hidden />
        </div>
      ) : null}
    </Link>
  );
}
