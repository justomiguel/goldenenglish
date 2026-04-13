"use client";

export interface SectionCapacityBarProps {
  activeCount: number;
  maxStudents: number;
  label: string;
}

export function SectionCapacityBar({ activeCount, maxStudents, label }: SectionCapacityBarProps) {
  const pct = maxStudents > 0 ? Math.min(100, Math.round((activeCount / maxStudents) * 100)) : 0;
  const full = pct >= 100;
  return (
    <div className="min-w-0 flex-1 space-y-1">
      <div className="flex justify-between text-xs text-[var(--color-muted-foreground)]">
        <span className="truncate">{label}</span>
        <span className="shrink-0 tabular-nums">
          {activeCount}/{maxStudents}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-muted)]"
        role="progressbar"
        aria-valuenow={activeCount}
        aria-valuemin={0}
        aria-valuemax={maxStudents}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all ${
            full ? "bg-[var(--color-error)]" : "bg-[var(--color-primary)]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
