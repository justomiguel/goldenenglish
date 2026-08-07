"use client";

import type { PointerEvent } from "react";
import type { SectionScheduleSlot } from "@/types/academics";
import { timeToMinutes } from "@/lib/academics/sectionScheduleSlots";
import { snapMinutesToStep } from "@/lib/academics/sectionScheduleTimeSnap";
import { AcademicSectionWeekScheduleGridBlock } from "@/components/organisms/AcademicSectionWeekScheduleGridBlock";

type BlockRef = { index: number; slot: SectionScheduleSlot };

const KEYBOARD_CREATE_DEFAULT_START_MINUTES = 9 * 60;

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function resolveSuggestedCreateStartMinutes(args: {
  dayBlocks: BlockRef[];
  windowStartMinutes: number;
  windowEndMinutes: number;
  defaultDurationMinutes: number;
  stepMinutes: number;
}): number {
  const start = Math.max(0, Math.min(24 * 60, args.windowStartMinutes));
  const end = Math.max(start, Math.min(24 * 60, args.windowEndMinutes));
  const duration = Math.max(args.stepMinutes, args.defaultDurationMinutes);
  const preferredStart = Math.max(
    start,
    Math.min(end - duration, KEYBOARD_CREATE_DEFAULT_START_MINUTES),
  );

  const blocks = args.dayBlocks
    .map((b) => ({
      start: timeToMinutes(b.slot.startTime),
      end: timeToMinutes(b.slot.endTime),
    }))
    .filter((b) => b.start >= 0 && b.end > b.start)
    .toSorted((a, b) => a.start - b.start);

  const scan = (scanStart: number): number | null => {
    for (
      let t = snapMinutesToStep(scanStart, args.stepMinutes);
      t + duration <= end;
      t += args.stepMinutes
    ) {
      const overlaps = blocks.some((b) => rangesOverlap(t, t + duration, b.start, b.end));
      if (!overlaps) return t;
    }
    return null;
  };

  const preferred = scan(preferredStart);
  if (preferred !== null) return preferred;

  const fallback = scan(start);
  if (fallback !== null) return fallback;

  return snapMinutesToStep(start, args.stepMinutes);
}

export interface AcademicSectionWeekScheduleGridDayCellProps {
  dayOfWeek: number;
  dayLabel: string;
  scheduleAddSlot: string;
  blocks: BlockRef[];
  selectedIndex: number | null;
  draggingIndex: number | null;
  unsavedByIndex: readonly boolean[];
  windowStartMinutes: number;
  windowEndMinutes: number;
  pxPerMinute: number;
  stepMinutes: number;
  defaultDurationMinutes: number;
  onCreatePointerDown: (dayOfWeek: number, e: PointerEvent<HTMLButtonElement>) => void;
  onCreateViaKeyboard: (dayOfWeek: number, startMinutes: number) => void;
  onSelectBlock: (index: number) => void;
  onMovePointerDown: (index: number, e: PointerEvent<HTMLButtonElement>) => void;
  onResizePointerDown: (index: number, e: PointerEvent<HTMLDivElement>) => void;
  testId: string;
}

export function AcademicSectionWeekScheduleGridDayCell({
  dayOfWeek,
  dayLabel,
  scheduleAddSlot,
  blocks,
  selectedIndex,
  draggingIndex,
  unsavedByIndex,
  windowStartMinutes,
  windowEndMinutes,
  pxPerMinute,
  stepMinutes,
  defaultDurationMinutes,
  onCreatePointerDown,
  onCreateViaKeyboard,
  onSelectBlock,
  onMovePointerDown,
  onResizePointerDown,
  testId,
}: AcademicSectionWeekScheduleGridDayCellProps) {
  const addLabel = `${scheduleAddSlot} ${dayLabel}`;

  return (
    <div className="relative h-full min-w-0 border-r border-[var(--color-border)]/35 last:border-r-0">
      <button
        type="button"
        data-testid={testId}
        className="absolute inset-0 z-0 rounded-[var(--layout-border-radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1"
        aria-label={addLabel}
        title={addLabel}
        onPointerDown={(e) => onCreatePointerDown(dayOfWeek, e)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          const suggested = resolveSuggestedCreateStartMinutes({
            dayBlocks: blocks,
            windowStartMinutes,
            windowEndMinutes,
            defaultDurationMinutes,
            stepMinutes,
          });
          onCreateViaKeyboard(dayOfWeek, suggested);
        }}
      >
        <span className="sr-only">{addLabel}</span>
      </button>

      {blocks.map(({ index, slot }) => {
        const start = timeToMinutes(slot.startTime);
        const end = timeToMinutes(slot.endTime);
        const topPx = (start - windowStartMinutes) * pxPerMinute;
        const blockHeight = Math.max(20, (end - start) * pxPerMinute);
        const visualState =
          draggingIndex === index
            ? ("dragging" as const)
            : unsavedByIndex[index]
              ? ("unsaved" as const)
              : ("saved" as const);
        return (
          <AcademicSectionWeekScheduleGridBlock
            key={`${dayOfWeek}:${slot.startTime}:${slot.endTime}:${index}`}
            index={index}
            slot={slot}
            dayLabel={dayLabel}
            topPx={topPx}
            heightPx={blockHeight}
            selected={selectedIndex === index}
            visualState={visualState}
            onSelect={onSelectBlock}
            onMovePointerDown={onMovePointerDown}
            onResizePointerDown={onResizePointerDown}
          />
        );
      })}
    </div>
  );
}

