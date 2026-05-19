"use client";

import { type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/atoms/Label";

export interface ParentWardOption {
  studentId: string;
  displayName: string;
}

interface ParentWardPickerProps {
  options: ParentWardOption[];
  selectedStudentId: string | null;
  label: string;
  hint: string;
  /** Base path for URL updates (e.g. "/en/dashboard/parent/tasks") */
  basePath: string;
  paramName?: string;
  /** Full-width touch styling for PWA parent routes */
  variant?: "default" | "pwa";
  selectId?: string;
}

function resolveDisplayName(
  options: ParentWardOption[],
  selectedStudentId: string | null,
): string {
  const match = options.find((o) => o.studentId === selectedStudentId);
  return match?.displayName ?? options[0]?.displayName ?? "";
}

export function ParentWardPicker({
  options,
  selectedStudentId,
  label,
  hint,
  basePath,
  paramName = "studentId",
  variant = "default",
  selectId = "parent-ward-picker",
}: ParentWardPickerProps) {
  const router = useRouter();
  const hintId = `${selectId}-hint`;
  const wrapperClass = variant === "pwa" ? "relative isolate w-full" : "max-w-sm";

  function onChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    const url = new URL(basePath, window.location.origin);
    if (next) url.searchParams.set(paramName, next);
    else url.searchParams.delete(paramName);
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  if (options.length === 0) return null;

  const displayName = resolveDisplayName(options, selectedStudentId);

  if (options.length === 1) {
    return (
      <div className={wrapperClass}>
        <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{label}</p>
        <p className="mt-1 text-base font-semibold text-[var(--color-foreground)]">{displayName}</p>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <Label htmlFor={selectId}>{label}</Label>
      <select
        id={selectId}
        name={paramName}
        value={selectedStudentId ?? ""}
        onChange={onChange}
        className="mt-1 block min-h-[44px] w-full appearance-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)]"
        aria-describedby={hintId}
      >
        {options.map((option) => (
          <option key={option.studentId} value={option.studentId}>
            {option.displayName}
          </option>
        ))}
      </select>
      <p id={hintId} className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        {hint}
      </p>
    </div>
  );
}
