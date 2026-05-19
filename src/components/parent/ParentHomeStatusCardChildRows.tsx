import type { ParentHomeChildPillarRow } from "@/lib/parent/buildParentHomeChildPillarRows";
import type { ParentPillarLevel } from "@/lib/parent/buildParentHomePillarSnapshot";

function rowTone(level: ParentPillarLevel): string {
  if (level === "ok") return "text-[var(--color-primary)]";
  if (level === "attention") return "text-[var(--color-secondary)]";
  return "text-[var(--color-muted-foreground)]";
}

export interface ParentHomeStatusCardChildRowsProps {
  rows: ParentHomeChildPillarRow[];
  ariaLabel: string;
}

export function ParentHomeStatusCardChildRows({ rows, ariaLabel }: ParentHomeStatusCardChildRowsProps) {
  return (
    <ul className="mt-2.5 space-y-2 border-t border-[var(--color-border)]/80 pt-2.5" aria-label={ariaLabel}>
      {rows.map((row) => (
        <li key={row.studentId} className="flex items-start justify-between gap-3 text-sm">
          <span className="min-w-0 shrink font-medium text-[var(--color-foreground)]">{row.displayName}</span>
          <span className={`shrink-0 text-right text-xs font-semibold leading-snug ${rowTone(row.level)}`}>
            {row.detail}
          </span>
        </li>
      ))}
    </ul>
  );
}
