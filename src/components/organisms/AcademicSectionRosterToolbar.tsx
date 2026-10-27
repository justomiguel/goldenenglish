"use client";

import type { ReactNode } from "react";
import type { Dictionary } from "@/types/i18n";

export type SectionRosterTabKey = "active" | "dropped" | "transferred";

export interface AcademicSectionRosterToolbarProps {
  dict: Dictionary["dashboard"]["academicSectionPage"];
  tab: SectionRosterTabKey;
  onTab: (k: SectionRosterTabKey) => void;
  counts?: Record<SectionRosterTabKey, number>;
  headerActions?: ReactNode;
  showCapacityOverride?: boolean;
  capacityOverride: boolean;
  onCapacityOverride: (v: boolean) => void;
  busy: boolean;
  msg: string | null;
}

export function AcademicSectionRosterToolbar({
  dict,
  tab,
  onTab,
  counts,
  headerActions,
  showCapacityOverride = true,
  capacityOverride,
  onCapacityOverride,
  busy,
  msg,
}: AcademicSectionRosterToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 border-b border-[var(--color-border)] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {(["active", "dropped", "transferred"] as const).map((k) => {
            const count = counts?.[k];
            const label = count !== undefined ? `${dict.tabs[k]} (${count})` : dict.tabs[k];
            return (
              <button
                key={k}
                type="button"
                className={`inline-flex min-h-[38px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                  tab === k
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/80"
                }`}
                onClick={() => onTab(k)}
              >
                {label}
              </button>
            );
          })}
        </div>
        {headerActions ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">{headerActions}</div>
        ) : null}
      </div>
      {showCapacityOverride ? (
        <label className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] sm:text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
            checked={capacityOverride}
            onChange={(e) => onCapacityOverride(e.target.checked)}
            disabled={busy}
          />
          {dict.capacityOverride}
        </label>
      ) : null}
      {msg ? <p className="text-sm text-[var(--color-foreground)]">{msg}</p> : null}
    </div>
  );
}
