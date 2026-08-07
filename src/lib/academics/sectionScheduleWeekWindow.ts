import type { SectionScheduleSlot } from "@/types/academics";
import { timeToMinutes } from "@/lib/academics/sectionScheduleSlots";
import { snapMinutesToStep } from "@/lib/academics/sectionScheduleTimeSnap";

export const SECTION_WEEK_SCHEDULE_STEP_MINUTES = 15;
/** ~32px per hour — compact admin week grid (15′ step × 8px). */
export const SECTION_WEEK_SCHEDULE_PX_PER_STEP = 8;
export const SECTION_WEEK_SCHEDULE_PX_PER_MINUTE =
  SECTION_WEEK_SCHEDULE_PX_PER_STEP / SECTION_WEEK_SCHEDULE_STEP_MINUTES;

const DEFAULT_WINDOW_START_MINUTES = 7 * 60;
const DEFAULT_WINDOW_END_MINUTES = 22 * 60;
const WINDOW_PADDING_MINUTES = 30;

export function resolveSectionScheduleWeekWindowMinutes(
  slots: SectionScheduleSlot[],
): { start: number; end: number } {
  let min = DEFAULT_WINDOW_START_MINUTES;
  let max = DEFAULT_WINDOW_END_MINUTES;
  for (const s of slots) {
    const a = timeToMinutes(s.startTime);
    const b = timeToMinutes(s.endTime);
    if (a >= 0) min = Math.min(min, a - WINDOW_PADDING_MINUTES);
    if (b >= 0) max = Math.max(max, b + WINDOW_PADDING_MINUTES);
  }
  min = Math.max(0, snapMinutesToStep(min, SECTION_WEEK_SCHEDULE_STEP_MINUTES));
  max = Math.min(24 * 60, snapMinutesToStep(max, SECTION_WEEK_SCHEDULE_STEP_MINUTES));
  if (max - min < 6 * 60) max = Math.min(24 * 60, min + 6 * 60);
  return { start: min, end: max };
}
