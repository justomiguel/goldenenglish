import { parseIsoDateParts } from "@/lib/calendar/civilGregorianDate";
import { cordobaWallClockToUtcMs } from "@/lib/calendar/argentinaCordobaUtc";
import { parseWallTimeHm } from "@/lib/calendar/parseWallTime";

/** Builds UTC instants for DB storage; all-day uses civil noon UTC anchor for stable ICS dates. */
export function inferSpecialEventIntervalCordoba(input: {
  eventDate: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
}): { starts_at: string; ends_at: string } | null {
  const p = parseIsoDateParts(input.eventDate);
  if (!p) return null;
  if (input.allDay) {
    const startMs = Date.UTC(p.y, p.m - 1, p.d, 12, 0, 0);
    const endMs = startMs + 86400000;
    return { starts_at: new Date(startMs).toISOString(), ends_at: new Date(endMs).toISOString() };
  }
  const st = parseWallTimeHm(input.startTime ?? "");
  const en = parseWallTimeHm(input.endTime ?? "");
  if (!st || !en) return null;
  const startMs = cordobaWallClockToUtcMs(p.y, p.m, p.d, st[0], st[1]);
  const endMs = cordobaWallClockToUtcMs(p.y, p.m, p.d, en[0], en[1]);
  if (endMs <= startMs) return null;
  return { starts_at: new Date(startMs).toISOString(), ends_at: new Date(endMs).toISOString() };
}
