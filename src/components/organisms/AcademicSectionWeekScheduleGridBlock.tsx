"use client";

import type { PointerEvent } from "react";
import type { SectionScheduleSlot } from "@/types/academics";

export type WeekScheduleBlockVisualState = "saved" | "unsaved" | "dragging";

export interface AcademicSectionWeekScheduleGridBlockProps {
  index: number;
  slot: SectionScheduleSlot;
  dayLabel: string;
  topPx: number;
  heightPx: number;
  selected: boolean;
  visualState: WeekScheduleBlockVisualState;
  onSelect: (index: number) => void;
  onMovePointerDown: (index: number, e: PointerEvent<HTMLButtonElement>) => void;
  onResizePointerDown: (index: number, e: PointerEvent<HTMLDivElement>) => void;
}

function blockChromeClass(visualState: WeekScheduleBlockVisualState, selected: boolean): string {
  const base =
    "relative flex h-full w-full flex-col rounded-[var(--layout-border-radius)] border px-2 py-1.5 text-left text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1";
  if (visualState === "dragging") {
    return [
      base,
      "z-20 border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-md ring-2 ring-[var(--color-primary)]/40",
    ].join(" ");
  }
  if (visualState === "unsaved") {
    return [
      base,
      "rounded-xl border-dashed border-[var(--color-primary)] bg-[var(--color-primary)]/30 text-[var(--color-foreground)]",
      selected ? "ring-2 ring-[var(--color-primary)]/40" : "",
    ].join(" ");
  }
  return [
    base,
    "rounded-xl border-[var(--color-primary)]/40 bg-[var(--color-primary)]/18 text-[var(--color-foreground)]",
    selected ? "ring-2 ring-[var(--color-primary)]/35" : "",
  ].join(" ");
}

export function AcademicSectionWeekScheduleGridBlock({
  index,
  slot,
  dayLabel,
  topPx,
  heightPx,
  selected,
  visualState,
  onSelect,
  onMovePointerDown,
  onResizePointerDown,
}: AcademicSectionWeekScheduleGridBlockProps) {
  const label = `${dayLabel} ${slot.startTime}–${slot.endTime}`;

  return (
    <div className="absolute left-1.5 right-1.5 z-[2]" style={{ top: topPx, height: heightPx }}>
      <button
        type="button"
        data-week-block
        data-schedule-state={visualState}
        className={blockChromeClass(visualState, selected)}
        aria-label={label}
        onPointerDown={(e) => {
          e.stopPropagation();
          onMovePointerDown(index, e);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(index);
        }}
      >
        <span className="font-medium tabular-nums">
          {slot.startTime}–{slot.endTime}
        </span>
        <span className="sr-only">{label}</span>
      </button>
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 z-10 h-2.5 cursor-ns-resize"
        onPointerDown={(e) => onResizePointerDown(index, e)}
      />
    </div>
  );
}
