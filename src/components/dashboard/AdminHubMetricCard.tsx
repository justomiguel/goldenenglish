import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface AdminHubMetricCardProps {
  href: string;
  icon: ReactNode;
  title: string;
  accentClass: string;
  children: ReactNode;
  linkLabel?: string;
  urgent?: boolean;
  /** Native tooltip on the whole card link (dictionary-backed). */
  hint?: string;
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
}: AdminHubMetricCardProps) {
  return (
    <Link
      href={href}
      title={hint}
      className={`group relative flex flex-col rounded-[var(--layout-border-radius)] border bg-[var(--color-background)] p-5 shadow-sm transition hover:shadow-md ${
        urgent
          ? "border-amber-300 ring-1 ring-amber-200"
          : "border-[var(--color-border)]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${accentClass}`}
        >
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
          {title}
        </h3>
      </div>

      <div className="mt-3 flex-1">{children}</div>

      {linkLabel && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] opacity-0 transition group-hover:opacity-100">
          <span>{linkLabel}</span>
          <ArrowRight className="h-3 w-3" aria-hidden />
        </div>
      )}
    </Link>
  );
}
