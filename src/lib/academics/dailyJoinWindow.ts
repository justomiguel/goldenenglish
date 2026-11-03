import { zonedWallTimeToUtc } from "@/lib/admin-digest/closedWeekBounds";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

type DailySlot = { dayOfWeek: number; startTime: string; endTime: string };

function wallCalendar(instant: Date, timeZone: string): { y: number; m: number; d: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(instant)) {
    map[part.type] = part.value;
  }
  return { y: Number(map.year), m: Number(map.month), d: Number(map.day) };
}

function localWeekday(y: number, m: number, d: number, timeZone: string): number {
  const noon = zonedWallTimeToUtc(y, m, d, 12, 0, 0, 0, timeZone);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(noon);
  return WEEKDAY_INDEX[weekday] ?? 0;
}

function addCalendarDays(y: number, m: number, d: number, delta: number): { y: number; m: number; d: number } {
  const shifted = new Date(Date.UTC(y, m - 1, d + delta));
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
  };
}

function parseHm(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(":").map(Number);
  return { hour, minute };
}

function shiftWallClock(
  y: number,
  m: number,
  d: number,
  hour: number,
  minute: number,
  deltaMinutes: number,
  timeZone: string,
): Date {
  let total = hour * 60 + minute + deltaMinutes;
  let dayDelta = 0;
  while (total < 0) {
    total += 24 * 60;
    dayDelta -= 1;
  }
  while (total >= 24 * 60) {
    total -= 24 * 60;
    dayDelta += 1;
  }
  const next = addCalendarDays(y, m, d, dayDelta);
  return zonedWallTimeToUtc(
    next.y,
    next.m,
    next.d,
    Math.floor(total / 60),
    total % 60,
    0,
    0,
    timeZone,
  );
}

export function openDailyWindow(input: {
  now: Date;
  timeZone: string;
  slots: DailySlot[];
}): (DailySlot & { expUnix: number }) | null {
  const today = wallCalendar(input.now, input.timeZone);
  const candidateDates = [
    addCalendarDays(today.y, today.m, today.d, -1),
    today,
    addCalendarDays(today.y, today.m, today.d, 1),
  ];

  const openMatches: (DailySlot & { expUnix: number; slotStartMs: number })[] = [];

  for (const date of candidateDates) {
    const weekday = localWeekday(date.y, date.m, date.d, input.timeZone);
    for (const slot of input.slots) {
      if (slot.dayOfWeek !== weekday) {
        continue;
      }
      const start = parseHm(slot.startTime);
      const end = parseHm(slot.endTime);
      const slotStart = zonedWallTimeToUtc(
        date.y,
        date.m,
        date.d,
        start.hour,
        start.minute,
        0,
        0,
        input.timeZone,
      );
      const windowStart = shiftWallClock(
        date.y,
        date.m,
        date.d,
        start.hour,
        start.minute,
        -15,
        input.timeZone,
      );
      const windowEnd = shiftWallClock(
        date.y,
        date.m,
        date.d,
        end.hour,
        end.minute,
        120,
        input.timeZone,
      );
      const nowMs = input.now.getTime();
      if (nowMs >= windowStart.getTime() && nowMs <= windowEnd.getTime()) {
        openMatches.push({
          ...slot,
          expUnix: Math.floor(windowEnd.getTime() / 1000),
          slotStartMs: slotStart.getTime(),
        });
      }
    }
  }

  if (openMatches.length === 0) {
    return null;
  }

  openMatches.sort((a, b) => a.slotStartMs - b.slotStartMs);
  const winner = openMatches[0];
  if (!winner) {
    return null;
  }
  const { slotStartMs: _slotStartMs, ...result } = winner;
  return result;
}
