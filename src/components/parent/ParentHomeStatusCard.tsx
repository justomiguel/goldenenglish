import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import type { ParentPillarLevel } from "@/lib/parent/buildParentHomePillarSnapshot";
import {
  ParentHomeStatusCardChildRows,
  type ParentHomeStatusCardChildRowsProps,
} from "@/components/parent/ParentHomeStatusCardChildRows";

export interface ParentHomeStatusCardProps {
  href: string;
  title: string;
  detail: string;
  statusLabel: string;
  level: ParentPillarLevel;
  icon: LucideIcon;
  variant?: "default" | "pwa";
  childRows?: ParentHomeStatusCardChildRowsProps["rows"];
  childRowsAriaLabel?: string;
}

function levelClasses(level: ParentPillarLevel): string {
  if (level === "ok") {
    return "border-[color-mix(in_oklch,var(--color-primary)_35%,var(--color-border))] bg-[color-mix(in_oklch,var(--color-primary)_6%,var(--color-background))]";
  }
  if (level === "attention") {
    return "border-[color-mix(in_oklch,var(--color-secondary)_40%,var(--color-border))] bg-[color-mix(in_oklch,var(--color-secondary)_10%,var(--color-background))]";
  }
  return "border-[var(--color-border)] bg-[var(--color-background)]";
}

function statusTone(level: ParentPillarLevel): string {
  if (level === "ok") return "text-[var(--color-primary)]";
  if (level === "attention") return "text-[var(--color-secondary)]";
  return "text-[var(--color-muted-foreground)]";
}

export function ParentHomeStatusCard({
  href,
  title,
  detail,
  statusLabel,
  level,
  icon: Icon,
  variant = "default",
  childRows,
  childRowsAriaLabel,
}: ParentHomeStatusCardProps) {
  const isPwa = variant === "pwa";
  const hasChildRows = childRows != null && childRows.length > 0;

  return (
    <Link
      href={href}
      className={`flex min-h-[72px] items-start gap-3 rounded-[var(--layout-border-radius)] border px-4 py-4 shadow-[var(--shadow-soft)] transition active:scale-[0.99] ${levelClasses(level)} ${
        isPwa ? "min-h-[88px]" : ""
      }`}
    >
      <span
        className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] ${statusTone(level)}`}
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--color-foreground)]">{title}</span>
        <span className={`mt-0.5 block text-xs font-semibold uppercase tracking-wide ${statusTone(level)}`}>
          {statusLabel}
        </span>
        {hasChildRows ? (
          <ParentHomeStatusCardChildRows rows={childRows} ariaLabel={childRowsAriaLabel ?? title} />
        ) : (
          <span className="mt-1 block text-sm text-[var(--color-muted-foreground)]">{detail}</span>
        )}
      </span>
      <ChevronRight
        className="mt-3 h-5 w-5 shrink-0 text-[var(--color-muted-foreground)]"
        aria-hidden
      />
    </Link>
  );
}
