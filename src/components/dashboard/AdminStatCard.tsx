import type { ReactNode } from "react";

export function AdminStatCard({
  icon,
  iconClass,
  label,
  value,
  hint,
  compact = false,
}: {
  icon: ReactNode;
  iconClass: string;
  label: string;
  value: string;
  hint: string;
  /** Phone strip: hide the share line until `sm`. */
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-[var(--shadow-soft)] sm:rounded-2xl sm:p-5">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full sm:h-11 sm:w-11 ${iconClass}`}>
          {icon}
        </span>
        <p className="text-xs font-medium text-[var(--color-muted-foreground)] sm:text-sm">{label}</p>
      </div>
      <p className="mt-1.5 font-display text-xl font-bold tracking-tight text-[var(--color-primary)] sm:mt-4 sm:text-3xl">{value}</p>
      <p
        className={`mt-0.5 truncate text-[11px] text-[var(--color-muted-foreground)] sm:mt-1 sm:text-sm ${compact ? "hidden sm:block" : ""}`}
      >
        {hint}
      </p>
    </div>
  );
}
