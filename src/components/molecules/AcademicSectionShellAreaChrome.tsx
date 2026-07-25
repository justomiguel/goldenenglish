"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { AcademicSectionShellAreaId } from "@/lib/academics/academicSectionShellTabOrder";

export interface AcademicSectionShellAreaChromeOption {
  id: AcademicSectionShellAreaId;
  label: string;
}

export interface AcademicSectionShellAreaChromeProps {
  backLabel: string;
  title: string;
  switcherAria: string;
  area: AcademicSectionShellAreaId;
  options: readonly AcademicSectionShellAreaChromeOption[];
  onBack: () => void;
  onSwitchArea: (area: AcademicSectionShellAreaId) => void;
}

export function AcademicSectionShellAreaChrome({
  backLabel,
  title,
  switcherAria,
  area,
  options,
  onBack,
  onSwitchArea,
}: AcademicSectionShellAreaChromeProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--color-border)] bg-[var(--color-muted)]/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </Button>
        <h2 className="truncate text-base font-semibold text-[var(--color-foreground)]">{title}</h2>
      </div>
      <label className="flex min-w-0 items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
        <span className="sr-only">{switcherAria}</span>
        <select
          aria-label={switcherAria}
          value={area}
          onChange={(e) => onSwitchArea(e.target.value as AcademicSectionShellAreaId)}
          className="min-h-[44px] min-w-[10rem] max-w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
