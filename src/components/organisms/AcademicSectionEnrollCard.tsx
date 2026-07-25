"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, UserPlus } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { searchAdminStudentsAction } from "@/app/[locale]/dashboard/admin/academics/actions";
import { ScheduleConflictResolutionModal } from "@/components/molecules/ScheduleConflictResolutionModal";
import { StaffSearchComboboxWithChipQueue } from "@/components/molecules/StaffSearchComboboxWithChipQueue";
import { useSectionEnrollmentQueue } from "@/hooks/useSectionEnrollmentQueue";

export interface AcademicSectionEnrollCardProps {
  locale: string;
  sectionId: string;
  sectionLabel: string;
  dict: Dictionary["dashboard"]["academicSectionPage"];
  conflictDict: Dictionary["dashboard"]["academics"]["conflictModal"];
  errors: Dictionary["dashboard"]["academics"]["errors"];
}

export function AcademicSectionEnrollCard({
  locale,
  sectionId,
  sectionLabel,
  dict,
  conflictDict,
  errors,
}: AcademicSectionEnrollCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [capacityOverride, setCapacityOverride] = useState(false);
  const copy = useMemo(
    () => ({
      previewOk: dict.previewOk,
      bulkPreviewAllOk: dict.bulkPreviewAllOk,
      bulkPreviewIssues: dict.bulkPreviewIssues,
      bulkEnrollDoneMany: dict.bulkEnrollDoneMany,
      bulkEnrollPartial: dict.bulkEnrollPartial,
      bulkEnrollFailed: dict.bulkEnrollFailed,
      successEnroll: dict.successEnroll,
    }),
    [dict],
  );

  const {
    queue,
    addPick,
    removeId,
    fieldResetKey,
    msg,
    warnParent,
    conflicts,
    targetSlots,
    modalOpen,
    setModalOpen,
    previewPending,
    enrollPending,
    busy,
    runPreview,
    runEnrollSingle,
    runEnrollAll,
  } = useSectionEnrollmentQueue({
    locale,
    sectionId,
    capacityOverride,
    errors: errors as unknown as Record<string, string>,
    copy,
    onEnrollSuccess: ({ remainingInQueue }) => {
      router.refresh();
      if (remainingInQueue === 0) setOpen(false);
    },
  });

  const queueLen = queue.length;
  const previewLabel = queueLen > 1 ? dict.previewAll : dict.preview;
  const enrollLabel = queueLen > 1 ? dict.enrollAll : dict.enroll;

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
        {dict.enrollOpenButton}
      </Button>
      {open ? (
        <Modal
          open={open}
          onOpenChange={(next) => {
            if (busy && !next) return;
            setOpen(next);
          }}
          titleId="academic-section-enroll-modal-title"
          title={dict.enrollTitle}
          disableClose={busy}
          dialogClassName="max-w-lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-muted-foreground)]">{dict.enrollModalLead}</p>
            <StaffSearchComboboxWithChipQueue
              id="academic-section-enroll-student"
              labelText={dict.studentSearchLabel}
              placeholder={dict.searchPlaceholder}
              inputTitle={dict.studentSearchTooltip}
              minCharsHint={dict.searchMin}
              prefetchWhenEmptyOnFocus
              disabled={busy}
              search={searchAdminStudentsAction}
              onPick={addPick}
              resetKey={fieldResetKey}
              selectedItems={queue}
              onRemoveSelected={removeId}
              queueLegend={dict.enrollQueueLegend}
              queueReminder={dict.enrollQueueReminder}
              removeChipAriaLabel={dict.removePickedStudentAria}
              queueDisabled={busy}
              resultsListHeading={dict.enrollSearchResultsHeading}
            />
            <label className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
              <input
                type="checkbox"
                checked={capacityOverride}
                onChange={(e) => setCapacityOverride(e.target.checked)}
                disabled={busy}
              />
              {dict.capacityOverride}
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={busy || queueLen === 0}
                isLoading={previewPending}
                onClick={runPreview}
              >
                {!previewPending ? <Eye className="h-4 w-4 shrink-0" aria-hidden /> : null}
                {previewLabel}
              </Button>
              <Button
                type="button"
                disabled={busy || queueLen === 0}
                isLoading={enrollPending}
                onClick={() => runEnrollAll()}
              >
                {!enrollPending ? <UserPlus className="h-4 w-4 shrink-0" aria-hidden /> : null}
                {enrollLabel}
              </Button>
            </div>
            {warnParent ? (
              <p className="text-sm font-medium text-[var(--color-error)]">{dict.parentPendingWarning}</p>
            ) : null}
            {msg ? <p className="text-sm text-[var(--color-foreground)]">{msg}</p> : null}
          </div>
        </Modal>
      ) : null}
      <ScheduleConflictResolutionModal
        open={modalOpen && Boolean(conflicts?.length) && queueLen === 1}
        onClose={() => setModalOpen(false)}
        locale={locale}
        dict={conflictDict}
        conflicts={conflicts ?? []}
        targetSlots={targetSlots}
        targetSectionLabel={sectionLabel}
        onConfirmDrop={(enrollmentId) => runEnrollSingle(enrollmentId)}
        isPending={enrollPending}
      />
    </>
  );
}
