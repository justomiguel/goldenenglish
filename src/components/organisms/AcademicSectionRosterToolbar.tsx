"use client";

import type { Dictionary } from "@/types/i18n";

export type SectionRosterTabKey = "active" | "dropped" | "transferred";

export interface AcademicSectionRosterToolbarProps {
  dict: Dictionary["dashboard"]["academicSectionPage"];
  tab: SectionRosterTabKey;
  onTab: (k: SectionRosterTabKey) => void;
  capacityOverride: boolean;
  onCapacityOverride: (v: boolean) => void;
  busy: boolean;
  msg: string | null;
}

export function AcademicSectionRosterToolbar({
  dict,
  tab,
  onTab,
  capacityOverride,
  onCapacityOverride,
  busy,
  msg,
}: AcademicSectionRosterToolbarProps) {
  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-3">
        {(["active", "dropped", "transferred"] as const).map((k) => (
          <button
            key={k}
            type="button"
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              tab === k
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "bg-[var(--color-muted)] text-[var(--color-foreground)]"
            }`}
            onClick={() => onTab(k)}
          >
            {dict.tabs[k]}
          </button>
        ))}
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={capacityOverride}
          onChange={(e) => onCapacityOverride(e.target.checked)}
          disabled={busy}
        />
        {dict.capacityOverride}
      </label>
      {msg ? <p className="mt-2 text-sm text-[var(--color-foreground)]">{msg}</p> : null}
    </>
  );
}
