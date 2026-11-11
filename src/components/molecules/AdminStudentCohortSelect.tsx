"use client";

import type { StudentFichaCohortOption } from "@/lib/dashboard/studentFichaCohort";

export interface AdminStudentCohortSelectProps {
  id: string;
  label: string;
  currentMark: string;
  options: StudentFichaCohortOption[];
  value: string;
  onChange: (cohortId: string) => void;
}

export function AdminStudentCohortSelect({
  id,
  label,
  currentMark,
  options,
  value,
  onChange,
}: AdminStudentCohortSelectProps) {
  if (options.length === 0) return null;
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={options.length === 1}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] disabled:opacity-70"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.isCurrent ? `${option.name} · ${currentMark}` : option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
