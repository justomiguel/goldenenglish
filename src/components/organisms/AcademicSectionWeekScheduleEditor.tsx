"use client";

import { CalendarClock, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AcademicSectionAreaBlock } from "@/components/molecules/AcademicSectionAreaBlock";
import { AcademicSectionWeekScheduleGrid } from "@/components/organisms/AcademicSectionWeekScheduleGrid";
import { AcademicSectionWeekScheduleBlockInspector } from "@/components/organisms/AcademicSectionWeekScheduleBlockInspector";
import { useSectionWeekScheduleDraft } from "@/hooks/useSectionWeekScheduleDraft";
import type { SectionScheduleSlot } from "@/types/academics";

export interface AcademicSectionWeekScheduleEditorDict {
  scheduleTitle: string;
  scheduleHint: string;
  scheduleAddSlot: string;
  scheduleDayLabel: string;
  scheduleStartLabel: string;
  scheduleEndLabel: string;
  scheduleInvalid: string;
  saveSchedule: string;
  saveScheduleError: string;
  unsavedBadge: string;
  selectedBlockTitle: string;
  editTimes: string;
  deleteBlock: string;
  closeInspectorAria: string;
  overlapError: string;
  createHint: string;
  gridAria: string;
  weekdays: {
    sun: string;
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
  };
}

export interface AcademicSectionWeekScheduleEditorProps {
  locale: string;
  sectionId: string;
  initialSlots: SectionScheduleSlot[];
  dict: AcademicSectionWeekScheduleEditorDict;
}

export function AcademicSectionWeekScheduleEditor({
  locale,
  sectionId,
  initialSlots,
  dict,
}: AcademicSectionWeekScheduleEditorProps) {
  const draft = useSectionWeekScheduleDraft({
    locale,
    sectionId,
    initialSlots,
    dict: {
      scheduleInvalid: dict.scheduleInvalid,
      saveScheduleError: dict.saveScheduleError,
      overlapError: dict.overlapError,
    },
  });

  const inspectorOpen = draft.selectedIndex !== null;

  return (
    <AcademicSectionAreaBlock
      id="section-configuration-schedule-heading"
      title={dict.scheduleTitle}
      lead={dict.scheduleHint}
      icon={CalendarClock}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.createHint}</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {draft.dirty ? (
            <span className="rounded-full bg-[var(--color-primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-primary)]">
              {dict.unsavedBadge}
            </span>
          ) : null}
          <Button
            type="button"
            className="min-h-[44px]"
            isLoading={draft.pending}
            disabled={draft.pending}
            onClick={draft.save}
          >
            {!draft.pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.saveSchedule}
          </Button>
        </div>
      </div>

      {draft.error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {draft.error}
        </p>
      ) : null}

      <div
        className={
          inspectorOpen
            ? "flex flex-col gap-3 lg:flex-row lg:items-stretch"
            : "block"
        }
      >
        <div className="min-w-0 flex-1 rounded-[var(--layout-border-radius)] bg-[var(--color-surface)]">
          <AcademicSectionWeekScheduleGrid
            slots={draft.slots}
            initialSlots={initialSlots}
            selectedIndex={draft.selectedIndex}
            setSelectedIndex={draft.setSelectedIndex}
            createAt={draft.createAt}
            moveBlock={draft.moveBlock}
            resizeBlock={draft.resizeBlock}
            dict={{
              gridAria: dict.gridAria,
              scheduleAddSlot: dict.scheduleAddSlot,
              weekdays: dict.weekdays,
            }}
          />
        </div>
        <AcademicSectionWeekScheduleBlockInspector
          slots={draft.slots}
          selectedIndex={draft.selectedIndex}
          setSelectedIndex={draft.setSelectedIndex}
          updateBlock={draft.updateBlock}
          removeBlock={draft.removeBlock}
          disabled={draft.pending}
          dict={{
            selectedBlockTitle: dict.selectedBlockTitle,
            scheduleDayLabel: dict.scheduleDayLabel,
            scheduleStartLabel: dict.scheduleStartLabel,
            scheduleEndLabel: dict.scheduleEndLabel,
            editTimes: dict.editTimes,
            deleteBlock: dict.deleteBlock,
            closeInspectorAria: dict.closeInspectorAria,
            weekdays: dict.weekdays,
          }}
        />
      </div>
    </AcademicSectionAreaBlock>
  );
}
