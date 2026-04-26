"use client";

import { GraduationCap, MapPin } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";
import { Button } from "@/components/atoms/Button";

export interface TeacherRosterStudentRowProps {
  label: string;
  avatarDisplayUrl: string | null;
  statusLabel: string;
  showActions: boolean;
  hasPendingTransfer: boolean;
  narrow: boolean;
  dict: Dictionary["dashboard"]["teacherMySections"];
  onOpenContext: () => void;
  onSuggestSection: () => void;
  onSuggestCohort: () => void;
}

export function TeacherRosterStudentRow({
  label,
  avatarDisplayUrl,
  statusLabel,
  showActions,
  hasPendingTransfer,
  narrow,
  dict,
  onOpenContext,
  onSuggestSection,
  onSuggestCohort,
}: TeacherRosterStudentRowProps) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--layout-border-radius)] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          onClick={onOpenContext}
        >
          <ProfileAvatar url={avatarDisplayUrl} displayName={label} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-[var(--color-foreground)]">{label}</span>
            {hasPendingTransfer ? (
              <span className="mt-0.5 inline-block rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-foreground)]">
                {dict.pendingRequestBadge}
              </span>
            ) : null}
          </span>
        </button>
      </div>
      {showActions ? (
        <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
          {narrow ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-h-[44px] flex-1 sm:flex-none"
                disabled={hasPendingTransfer}
                onClick={onSuggestSection}
              >
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {dict.rosterCtaSection}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-[44px] flex-1 sm:flex-none"
                disabled={hasPendingTransfer}
                onClick={onSuggestCohort}
              >
                <GraduationCap className="h-4 w-4 shrink-0" aria-hidden />
                {dict.rosterCtaCohort}
              </Button>
            </>
          ) : (
            <details className="relative">
              <summary className="flex min-h-[44px] min-w-[44px] cursor-pointer list-none items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm font-medium text-[var(--color-foreground)] [&::-webkit-details-marker]:hidden">
                {dict.studentMenu}
              </summary>
              <div className="absolute right-0 z-10 mt-1 min-w-[12rem] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 text-sm shadow-md">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-[var(--color-muted)] disabled:opacity-50"
                  disabled={hasPendingTransfer}
                  onClick={() => {
                    onSuggestSection();
                    closeActiveDetails();
                  }}
                >
                  {dict.suggestSection}
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-[var(--color-muted)] disabled:opacity-50"
                  disabled={hasPendingTransfer}
                  onClick={() => {
                    onSuggestCohort();
                    closeActiveDetails();
                  }}
                >
                  {dict.suggestCohort}
                </button>
              </div>
            </details>
          )}
        </div>
      ) : (
        <span className="text-xs text-[var(--color-muted-foreground)]">{statusLabel}</span>
      )}
    </li>
  );
}

function closeActiveDetails() {
  const el = document.activeElement;
  if (el && "closest" in el) {
    const details = (el as HTMLElement).closest("details");
    if (details) details.open = false;
  }
}
