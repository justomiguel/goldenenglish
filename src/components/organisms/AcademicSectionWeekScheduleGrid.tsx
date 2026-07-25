"use client";

import { useMemo } from "react";
import type { SectionScheduleSlot } from "@/types/academics";
import { SECTION_WEEK_UI_DAY_ORDER } from "@/lib/academics/sectionScheduleWeekColumns";
import { defaultSectionScheduleDurationMinutes } from "@/lib/academics/sectionScheduleDefaultDuration";
import { listSectionScheduleHourTicks } from "@/lib/academics/sectionScheduleHourTicks";
import { buildSectionScheduleSlotUnsavedFlags } from "@/lib/academics/sectionScheduleSlotUnsavedFlags";
import {
  resolveSectionScheduleWeekWindowMinutes,
  SECTION_WEEK_SCHEDULE_PX_PER_MINUTE,
  SECTION_WEEK_SCHEDULE_STEP_MINUTES,
} from "@/lib/academics/sectionScheduleWeekWindow";
import { sectionScheduleWeekdayKey } from "@/lib/academics/sectionScheduleWeekdayKey";
import { AcademicSectionWeekScheduleGridDayCell } from "@/components/organisms/AcademicSectionWeekScheduleGridDayCell";
import { AcademicSectionWeekScheduleGridHourLines } from "@/components/organisms/AcademicSectionWeekScheduleGridHourLines";
import { useSectionWeekScheduleGridPointer } from "@/hooks/useSectionWeekScheduleGridPointer";

const STEP_MINUTES = SECTION_WEEK_SCHEDULE_STEP_MINUTES;
const PX_PER_MINUTE = SECTION_WEEK_SCHEDULE_PX_PER_MINUTE;

type Dict = {
  gridAria: string;
  scheduleAddSlot: string;
  weekdays: {
    sun: string;
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
  };
};

export interface AcademicSectionWeekScheduleGridProps {
  slots: SectionScheduleSlot[];
  initialSlots: SectionScheduleSlot[];
  selectedIndex: number | null;
  setSelectedIndex: (i: number | null) => void;
  createAt: (dayOfWeek: number, startMinutes: number) => void;
  moveBlock: (index: number, dayOfWeek: number, startMinutes: number) => void;
  resizeBlock: (index: number, endMinutes: number) => void;
  dict: Dict;
}

export function AcademicSectionWeekScheduleGrid({
  slots,
  initialSlots,
  selectedIndex,
  setSelectedIndex,
  createAt,
  moveBlock,
  resizeBlock,
  dict,
}: AcademicSectionWeekScheduleGridProps) {
  const windowMinutes = useMemo(() => resolveSectionScheduleWeekWindowMinutes(slots), [slots]);
  const heightPx = Math.max(1, (windowMinutes.end - windowMinutes.start) * PX_PER_MINUTE);
  const hourTicks = useMemo(
    () => listSectionScheduleHourTicks(windowMinutes.start, windowMinutes.end),
    [windowMinutes.end, windowMinutes.start],
  );
  const unsavedByIndex = useMemo(
    () => buildSectionScheduleSlotUnsavedFlags(slots, initialSlots),
    [initialSlots, slots],
  );
  const defaultDurationMinutes = useMemo(() => defaultSectionScheduleDurationMinutes(slots), [slots]);

  const {
    daysRef,
    draggingIndex,
    onCreatePointerDown,
    onBlockPointerDown,
    onResizePointerDown,
    onPointerMove,
    onPointerUp,
  } = useSectionWeekScheduleGridPointer({
    slots,
    selectedIndex,
    setSelectedIndex,
    createAt,
    moveBlock,
    resizeBlock,
    windowStartMinutes: windowMinutes.start,
  });

  const slotsByDay = useMemo(() => {
    const map = new Map<number, Array<{ index: number; slot: SectionScheduleSlot }>>();
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i]!;
      const list = map.get(s.dayOfWeek) ?? [];
      list.push({ index: i, slot: s });
      map.set(s.dayOfWeek, list);
    }
    return map;
  }, [slots]);

  return (
    <div role="region" aria-label={dict.gridAria} className="space-y-3">
        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-1.5">
        <div aria-hidden />
        <div className="grid grid-cols-7 gap-0 border-b border-[var(--color-border)]/50 pb-2">
          {SECTION_WEEK_UI_DAY_ORDER.map((dayOfWeek) => (
            <div
              key={dayOfWeek}
              className="text-center text-xs font-semibold tracking-wide text-[var(--color-muted-foreground)]"
            >
              {dict.weekdays[sectionScheduleWeekdayKey(dayOfWeek)]}
            </div>
          ))}
        </div>

        <div className="relative" style={{ height: heightPx }} data-testid="week-grid-time-gutter">
          <AcademicSectionWeekScheduleGridHourLines
            hourTicks={hourTicks}
            windowStartMinutes={windowMinutes.start}
            pxPerMinute={PX_PER_MINUTE}
            gutterOnly
          />
        </div>

        <div
          ref={daysRef}
          data-testid="week-grid-days"
          className="relative grid grid-cols-7 gap-0 overflow-hidden bg-[var(--color-surface)]"
          style={{ height: heightPx }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <AcademicSectionWeekScheduleGridHourLines
            hourTicks={hourTicks}
            windowStartMinutes={windowMinutes.start}
            pxPerMinute={PX_PER_MINUTE}
          />
          {SECTION_WEEK_UI_DAY_ORDER.map((dayOfWeek) => {
            const blocks = slotsByDay.get(dayOfWeek) ?? [];
            const dayLabel = dict.weekdays[sectionScheduleWeekdayKey(dayOfWeek)];
            return (
              <AcademicSectionWeekScheduleGridDayCell
                key={dayOfWeek}
                dayOfWeek={dayOfWeek}
                dayLabel={dayLabel}
                scheduleAddSlot={dict.scheduleAddSlot}
                blocks={blocks}
                selectedIndex={selectedIndex}
                draggingIndex={draggingIndex}
                unsavedByIndex={unsavedByIndex}
                windowStartMinutes={windowMinutes.start}
                windowEndMinutes={windowMinutes.end}
                pxPerMinute={PX_PER_MINUTE}
                stepMinutes={STEP_MINUTES}
                defaultDurationMinutes={defaultDurationMinutes}
                onCreatePointerDown={onCreatePointerDown}
                onCreateViaKeyboard={createAt}
                onSelectBlock={setSelectedIndex}
                onMovePointerDown={onBlockPointerDown}
                onResizePointerDown={onResizePointerDown}
                testId={`week-grid-day-${dayOfWeek}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
