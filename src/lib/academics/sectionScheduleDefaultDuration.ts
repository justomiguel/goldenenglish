import { timeToMinutes } from "@/lib/academics/sectionScheduleSlots";

const DEFAULT_DURATION_MINUTES = 60;

type SlotTimes = { startTime: string; endTime: string };

function slotDurationMinutes(slot: SlotTimes): number {
  return timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
}

/** Returns the mode duration among slots; on tie, picks the shortest duration. Empty → 60. */
export function defaultSectionScheduleDurationMinutes(
  slots: SlotTimes[],
): number {
  if (slots.length === 0) return DEFAULT_DURATION_MINUTES;

  const counts = new Map<number, number>();
  for (const slot of slots) {
    const d = slotDurationMinutes(slot);
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }

  let bestDuration = DEFAULT_DURATION_MINUTES;
  let bestCount = 0;
  for (const [duration, count] of counts) {
    if (count > bestCount || (count === bestCount && duration < bestDuration)) {
      bestCount = count;
      bestDuration = duration;
    }
  }
  return bestDuration;
}
