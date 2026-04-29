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
}

export function ParentWardPicker({
  options,
  selectedStudentId,
  label,
  hint,
  basePath,
  paramName = "studentId",
}: ParentWardPickerProps) {
  const router = useRouter();

  function onChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    const url = new URL(basePath, window.location.origin);
    if (next) url.searchParams.set(paramName, next);
    else url.searchParams.delete(paramName);
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  if (options.length <= 1) return null;

  return (
    <div className="max-w-sm">
      <Label htmlFor="parent-ward-picker">{label}</Label>
      <select
        id="parent-ward-picker"
        name={paramName}
        value={selectedStudentId ?? ""}
        onChange={onChange}
        className="mt-1 block min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)]"
        aria-describedby="parent-ward-picker-hint"
      >
        {options.map((option) => (
          <option key={option.studentId} value={option.studentId}>
            {option.displayName}
          </option>
        ))}
      </select>
      <p
        id="parent-ward-picker-hint"
        className="mt-1 text-xs text-[var(--color-muted-foreground)]"
      >
        {hint}
      </p>
    </div>
  );
}
