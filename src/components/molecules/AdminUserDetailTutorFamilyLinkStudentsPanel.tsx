"use client";

import { ChevronUp, Save } from "lucide-react";
import type { TutorStudentRelationshipCode } from "@/lib/register/tutorStudentRelationship";
import type { Dictionary } from "@/types/i18n";
import type { AdminStudentSearchHitLike } from "@/components/molecules/AdminStudentSearchCombobox";
import { Button } from "@/components/atoms/Button";
import { StaffSearchComboboxWithChipQueue } from "@/components/molecules/StaffSearchComboboxWithChipQueue";
import { AdminUserDetailTutorRelationshipSelect } from "@/components/molecules/AdminUserDetailTutorRelationshipSelect";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserDetailTutorFamilyLinkStudentsPanelProps {
  labels: UserLabels;
  hasLinkedStudents: boolean;
  onHide: () => void;
  relationship: TutorStudentRelationshipCode | "";
  onRelationshipChange: (v: TutorStudentRelationshipCode | "") => void;
  busy: boolean;
  search: (q: string) => Promise<AdminStudentSearchHitLike[]>;
  onPick: (hit: AdminStudentSearchHitLike) => void;
  fieldResetKey: number;
  linkedStudentIds: readonly string[];
  queue: AdminStudentSearchHitLike[];
  onRemoveFromQueue: (id: string) => void;
  onSave: () => void;
}

export function AdminUserDetailTutorFamilyLinkStudentsPanel({
  labels,
  hasLinkedStudents,
  onHide,
  relationship,
  onRelationshipChange,
  busy,
  search,
  onPick,
  fieldResetKey,
  linkedStudentIds,
  queue,
  onRemoveFromQueue,
  onSave,
}: AdminUserDetailTutorFamilyLinkStudentsPanelProps) {
  return (
    <div className="mt-5 border-t border-[var(--color-border)] pt-4">
      <div
        className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 p-4 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-background)_80%,transparent)]"
        aria-labelledby="admin-tutor-family-link-panel-title"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)]/80 pb-3">
          <h3 id="admin-tutor-family-link-panel-title" className="text-sm font-semibold text-[var(--color-secondary)]">
            {labels.detailTutorFamilyLinkStudentsPanelTitle}
          </h3>
          {hasLinkedStudents ? (
            <Button type="button" variant="ghost" size="sm" className="shrink-0" disabled={busy} onClick={onHide}>
              <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
              {labels.detailTutorFamilyHideLinkStudentsPanel}
            </Button>
          ) : null}
        </div>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailTutorFamilyLinkStudentsIntro}</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailTutorFamilyLinkRelationshipLead}</p>
          <AdminUserDetailTutorRelationshipSelect
            value={relationship}
            onChange={onRelationshipChange}
            labels={labels}
            disabled={busy}
          />
          <StaffSearchComboboxWithChipQueue
            id="admin-user-tutor-family-student-search"
            labelText={labels.detailTutorFamilyStudentSearchLabel}
            placeholder={labels.detailTutorFamilyStudentSearchPlaceholder}
            inputTitle={labels.detailTutorFamilyStudentSearchTooltip}
            minCharsHint={labels.detailTutorMinChars}
            prefetchWhenEmptyOnFocus
            search={search}
            onPick={onPick}
            resetKey={fieldResetKey}
            persistentExcludeIds={linkedStudentIds}
            selectedItems={queue}
            onRemoveSelected={onRemoveFromQueue}
            queueLegend={labels.detailTutorQueueLegend}
            queueReminder={labels.detailTutorFamilyQueueReminder}
            removeChipAriaLabel={labels.detailTutorRemoveChipAria}
            queueDisabled={busy}
            resultsListHeading={labels.detailTutorFamilyStudentSearchResultsHeading}
          />
          <Button type="button" variant="primary" size="sm" isLoading={busy} onClick={() => void onSave()}>
            {!busy ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {labels.detailTutorFamilySaveLinks}
          </Button>
        </div>
      </div>
    </div>
  );
}
