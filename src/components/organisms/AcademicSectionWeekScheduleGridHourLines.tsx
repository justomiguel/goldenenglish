"use client";

import { minutesToHhMm } from "@/lib/academics/sectionScheduleTimeSnap";

export interface AcademicSectionWeekScheduleGridHourLinesProps {
  hourTicks: readonly number[];
  windowStartMinutes: number;
  pxPerMinute: number;
  /** When true, render only the left gutter labels (no cross-day lines). */
  gutterOnly?: boolean;
}

export function AcademicSectionWeekScheduleGridHourLines({
  hourTicks,
  windowStartMinutes,
  pxPerMinute,
  gutterOnly = false,
}: AcademicSectionWeekScheduleGridHourLinesProps) {
  if (gutterOnly) {
    return (
      <div className="relative h-full" aria-hidden>
        {hourTicks.map((tick) => {
          const topPx = (tick - windowStartMinutes) * pxPerMinute;
          return (
            <div
              key={tick}
              className="absolute right-0 -translate-y-1/2 pr-1 text-[11px] tabular-nums leading-none text-[var(--color-muted-foreground)]"
              style={{ top: topPx }}
            >
              {minutesToHhMm(tick)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
      {hourTicks.map((tick) => {
        const topPx = (tick - windowStartMinutes) * pxPerMinute;
        return (
          <div
            key={tick}
            className="absolute left-0 right-0 border-t border-dashed border-[var(--color-border)]/70"
            style={{ top: topPx }}
          />
        );
      })}
    </div>
  );
}
