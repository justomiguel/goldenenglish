import type { ReactNode } from "react";

export function AdminStatCard({
  icon,
  iconClass,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  iconClass: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2 shadow-[var(--shadow-soft)] sm:rounded-2xl sm:p-5">
      <div className="flex items-center gap-1.5 sm:gap-3">
        <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${iconClass}`}>
          {icon}
        </span>
        <p className="min-w-0 truncate text-[11px] font-medium leading-tight text-[var(--color-muted-foreground)] sm:text-sm">{label}</p>
      </div>
      <p className="mt-1 font-display text-lg font-bold tracking-tight text-[var(--color-primary)] sm:mt-4 sm:text-3xl">{value}</p>
      <p className="mt-0.5 hidden truncate text-[11px] text-[var(--color-muted-foreground)] sm:mt-1 sm:block sm:text-sm">
        {hint}
      </p>
    </div>
  );
}
