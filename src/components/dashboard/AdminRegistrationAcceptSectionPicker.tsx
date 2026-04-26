"use client";

import { ChevronRight, SkipForward } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { SectionCapacityBar } from "@/components/molecules/SectionCapacityBar";
import type { Dictionary } from "@/types/i18n";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";

export interface AdminRegistrationAcceptSectionPickerProps {
  busy: boolean;
  formError: string | null;
  sections: CurrentCohortSection[];
  cohortName: string | undefined;
  labels: Dictionary["admin"]["registrations"];
  onPickSection: (sectionId: string) => void;
  onSkipSection: () => void;
}

export function AdminRegistrationAcceptSectionPicker({
  busy,
  formError,
  sections,
  cohortName,
  labels,
  onPickSection,
  onSkipSection,
}: AdminRegistrationAcceptSectionPickerProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-[var(--color-foreground)]">
        {labels.sectionPickerTitle ?? "Assign section"}
      </p>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        {labels.sectionPickerLead ?? "Choose a section from the current cohort."}
        {cohortName ? ` — ${cohortName}` : ""}
      </p>

      <ul className="space-y-2">
        {sections.map((sec) => {
          const full = sec.activeCount >= sec.maxStudents;
          return (
            <li key={sec.id}>
              <button
                type="button"
                disabled={busy || full}
                onClick={() => void onPickSection(sec.id)}
                className="flex w-full items-center gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-3 py-2 text-left transition hover:bg-[var(--color-muted)]/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{sec.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{sec.teacherName}</p>
                </div>
                <div className="w-28 shrink-0">
                  <SectionCapacityBar
                    activeCount={sec.activeCount}
                    maxStudents={sec.maxStudents}
                    label={sec.name}
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {formError ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="button" variant="secondary" className="min-h-[44px] px-4" onClick={onSkipSection}>
          <SkipForward className="h-4 w-4 shrink-0" aria-hidden />
          {labels.skipSectionEnrollment ?? "Skip"}
        </Button>
      </div>
    </div>
  );
}
