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

export interface SectionOption {
  id: string;
  label: string;
}

export interface AcademicEnrollPanelProps {
  locale: string;
  dict: Dictionary;
  sections: SectionOption[];
}

export function AcademicEnrollPanel({ locale, dict, sections }: AcademicEnrollPanelProps) {
  const router = useRouter();
  const d = dict.dashboard.academics.enrollPanel;
  const modalDict = dict.dashboard.academics.conflictModal;
  const errors = dict.dashboard.academics.errors;
  const [capacityOverride, setCapacityOverride] = useState(false);
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");

  const copy = useMemo(
    () => ({
      previewOk: d.previewOk,
      bulkPreviewAllOk: d.bulkPreviewAllOk,
      bulkPreviewIssues: d.bulkPreviewIssues,
      bulkEnrollDoneMany: d.bulkEnrollDoneMany,
      bulkEnrollPartial: d.bulkEnrollPartial,
      bulkEnrollFailed: d.bulkEnrollFailed,
      successEnroll: d.enrollOk,
    }),
    [d],
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

  const sectionLabel = sections.find((s) => s.id === sectionId)?.label ?? "";
  const queueLen = queue.length;
  const previewLabel = queueLen > 1 ? d.previewAll : d.preview;
  const enrollLabel = queueLen > 1 ? d.enrollAll : d.enroll;
  if (sections.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{d.noSections}</p>;
  }

  return (
    <div className="max-w-xl space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <StaffSearchComboboxWithChipQueue
        id="academic-enroll-panel-student"
        labelText={d.studentSearchLabel}
        placeholder={d.searchPlaceholder}
        inputTitle={d.studentSearchTooltip}
        minCharsHint={d.searchMin}
        prefetchWhenEmptyOnFocus
        disabled={busy}
        search={searchAdminStudentsAction}
        onPick={addPick}
        resetKey={fieldResetKey}
        selectedItems={queue}
        onRemoveSelected={removeId}
        queueLegend={d.enrollQueueLegend}
        queueReminder={d.enrollQueueReminder}
        removeChipAriaLabel={d.removePickedStudentAria}
        queueDisabled={busy}
        resultsListHeading={d.enrollSearchResultsHeading}
      />
      <div>
        <label className="block text-sm font-medium" htmlFor="ae-section">
          {d.sectionLabel}
        </label>
        <select
          id="ae-section"
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={capacityOverride}
          onChange={(e) => setCapacityOverride(e.target.checked)}
        />
        {d.capacityOverride}
      </label>
      {warnParent ? <p className="text-sm font-medium text-[var(--color-error)]">{d.parentPendingWarning}</p> : null}
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
      {msg ? <p className="text-sm text-[var(--color-foreground)]">{msg}</p> : null}
      <ScheduleConflictResolutionModal
        open={modalOpen && Boolean(conflicts?.length) && queueLen === 1}
        onClose={() => setModalOpen(false)}
        locale={locale}
        dict={modalDict}
        conflicts={conflicts ?? []}
        targetSlots={targetSlots}
        targetSectionLabel={sectionLabel}
        onConfirmDrop={(enrollmentId) => runEnrollSingle(enrollmentId)}
        isPending={enrollPending}
      />
    </div>
  );
}
