export type ClosedWeekBounds = {
  weekStart: Date;
  weekEnd: Date;
  weekStartDate: string;
  priorWeekStartDate: string;
  monthStart: string;
  monthEnd: string;
};

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function wallParts(instant: Date, timeZone: string): { y: number; m: number; d: number; weekday: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(instant)) {
    map[part.type] = part.value;
  }
  return {
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
    weekday: WEEKDAY_INDEX[map.weekday] ?? 0,
  };
}

function offsetMs(instant: Date, timeZone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(instant)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return asUtc - instant.getTime();
}

/** Convert a wall-clock time in `timeZone` to a UTC instant. */
export function zonedWallTimeToUtc(
  y: number,
  m: number,
  d: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  timeZone: string,
): Date {
  const utcGuess = new Date(Date.UTC(y, m - 1, d, hour, minute, second, millisecond));
  const corrected = new Date(utcGuess.getTime() - offsetMs(utcGuess, timeZone));
  const drift = offsetMs(corrected, timeZone) - offsetMs(utcGuess, timeZone);
  return new Date(corrected.getTime() - drift);
}

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addDays(y: number, m: number, d: number, days: number): { y: number; m: number; d: number } {
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return { y: utc.getUTCFullYear(), m: utc.getUTCMonth() + 1, d: utc.getUTCDate() };
}

/** Last completed Monday 00:00 through Sunday 23:59:59.999 in `timeZone`. */
export function closedWeekBounds(now: Date, timeZone: string): ClosedWeekBounds {
  const today = wallParts(now, timeZone);
  const daysSinceSunday = today.weekday;
  const lastSunday = addDays(today.y, today.m, today.d, daysSinceSunday === 0 ? -7 : -daysSinceSunday);
  const monday = addDays(lastSunday.y, lastSunday.m, lastSunday.d, -6);
  const nextMonday = addDays(monday.y, monday.m, monday.d, 7);
  const priorMonday = addDays(monday.y, monday.m, monday.d, -7);
  const monthEndDay = new Date(Date.UTC(today.y, today.m, 0)).getUTCDate();
  const weekStart = zonedWallTimeToUtc(monday.y, monday.m, monday.d, 0, 0, 0, 0, timeZone);
  return {
    weekStart,
    weekEnd: new Date(
      zonedWallTimeToUtc(nextMonday.y, nextMonday.m, nextMonday.d, 0, 0, 0, 0, timeZone).getTime() - 1,
    ),
    weekStartDate: ymd(monday.y, monday.m, monday.d),
    priorWeekStartDate: ymd(priorMonday.y, priorMonday.m, priorMonday.d),
    monthStart: ymd(today.y, today.m, 1),
    monthEnd: ymd(today.y, today.m, monthEndDay),
  };
}
