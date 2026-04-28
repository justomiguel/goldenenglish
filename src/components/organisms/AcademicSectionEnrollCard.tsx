"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, UserPlus } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
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
    onEnrollSuccess: () => router.refresh(),
  });

  const queueLen = queue.length;
  const previewLabel = queueLen > 1 ? dict.previewAll : dict.preview;
  const enrollLabel = queueLen > 1 ? dict.enrollAll : dict.enroll;
  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.enrollTitle}</h2>
      <div className="mt-3 space-y-3">
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
        <label className="flex items-center gap-2 text-sm">
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
    </section>
  );
}
