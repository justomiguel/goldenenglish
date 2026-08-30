import { ChevronUp, Save, UserPlus } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { TutorStudentRelationshipCode } from "@/lib/register/tutorStudentRelationship";
import type { AdminStudentSearchHitLike } from "@/components/molecules/AdminStudentSearchCombobox";
import { StaffSearchComboboxWithChipQueue } from "@/components/molecules/StaffSearchComboboxWithChipQueue";
import { AdminUserDetailTutorRelationshipSelect } from "@/components/molecules/AdminUserDetailTutorRelationshipSelect";
import { Button } from "@/components/atoms/Button";

type UserLabels = Dictionary["admin"]["users"];

interface AdminUserDetailTutorAddPanelProps {
  labels: UserLabels;
  hasTutors: boolean;
  rowBusy: boolean;
  busy: boolean;
  relationship: TutorStudentRelationshipCode | "";
  onRelationshipChange: (value: TutorStudentRelationshipCode | "") => void;
  search: (q: string) => Promise<AdminStudentSearchHitLike[]>;
  onPick: (hit: AdminStudentSearchHitLike) => void;
  fieldResetKey: number;
  linkedTutorIds: string[];
  queue: AdminStudentSearchHitLike[];
  onRemoveFromQueue: (id: string) => void;
  onSave: () => void;
  onHide: () => void;
  onOpenCreate: () => void;
}

export function AdminUserDetailTutorAddPanel({
  labels,
  hasTutors,
  rowBusy,
  busy,
  relationship,
  onRelationshipChange,
  search,
  onPick,
  fieldResetKey,
  linkedTutorIds,
  queue,
  onRemoveFromQueue,
  onSave,
  onHide,
  onOpenCreate,
}: AdminUserDetailTutorAddPanelProps) {
  return (
    <div className="mt-5 space-y-4 border-t border-[var(--color-border)] pt-4">
      {hasTutors ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--color-primary)]">{labels.detailTutorAddPanelTitle}</h3>
          <Button type="button" variant="ghost" size="sm" className="shrink-0" disabled={rowBusy} onClick={onHide}>
            <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
            {labels.detailTutorHideAddPanel}
          </Button>
        </div>
      ) : null}
      <div className="space-y-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailTutorLinkHint}</p>
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailTutorLinkRelationshipLead}</p>
        <AdminUserDetailTutorRelationshipSelect
          value={relationship}
          onChange={onRelationshipChange}
          labels={labels}
          disabled={busy}
        />
        <StaffSearchComboboxWithChipQueue
          id="admin-user-tutor-search"
          labelText={labels.detailTutorSearchLabel}
          placeholder={labels.detailTutorSearchPlaceholder}
          inputTitle={labels.detailTutorSearchTooltip}
          minCharsHint={labels.detailTutorMinChars}
          prefetchWhenEmptyOnFocus
          search={search}
          onPick={onPick}
          resetKey={fieldResetKey}
          persistentExcludeIds={linkedTutorIds}
          selectedItems={queue}
          onRemoveSelected={onRemoveFromQueue}
          queueLegend={labels.detailTutorQueueLegend}
          queueReminder={labels.detailTutorQueueReminder}
          removeChipAriaLabel={labels.detailTutorRemoveChipAria}
          queueDisabled={busy}
          resultsListHeading={labels.detailTutorSearchResultsHeading}
        />
        <Button type="button" variant="primary" size="sm" isLoading={busy} onClick={onSave}>
          {!busy ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {labels.detailTutorSave}
        </Button>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailTutorCreateIntro}</p>
        <Button type="button" variant="secondary" size="sm" onClick={onOpenCreate}>
          <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
          {labels.detailTutorCreateOpen}
        </Button>
      </div>
    </div>
  );
}
