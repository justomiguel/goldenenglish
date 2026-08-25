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
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${iconClass}`}>
          {icon}
        </span>
        <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{label}</p>
      </div>
      <p className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--color-primary)]">{value}</p>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{hint}</p>
    </div>
  );
}
