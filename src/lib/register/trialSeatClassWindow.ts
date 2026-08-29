import { instituteCalendarDateIso } from "@/lib/datetime/instituteCalendarDateIso";
import { instituteCalendarPartsInTimeZone } from "@/lib/datetime/instituteCalendarMonthRange";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** `HH:MM` or Postgres `HH:MM:SS` → 24h `HH:MM`. */
export function normalizeTrialSeatStartHm(raw: string): string {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "00:00";
  return `${pad2(Number(m[1]))}:${m[2]}`;
}

function wallPartsInZone(instant: Date, timeZone: string): {
  y: number;
  m: number;
  d: number;
  h: number;
  min: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(instant)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  return {
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
    h: Number(map.hour),
    min: Number(map.minute),
  };
}

/** Civil `dateIso` + clock in `timeZone` as a UTC instant. */
export function instituteZonedDateTimeUtc(
  dateIso: string,
  startTime: string,
  timeZone: string,
): Date {
  const [y, mo, d] = dateIso.split("-").map(Number);
  const hm = normalizeTrialSeatStartHm(startTime);
  const [hh, mm] = hm.split(":").map(Number);
  if (![y, mo, d, hh, mm].every(Number.isFinite)) return new Date(NaN);
  let utcMs = Date.UTC(y, mo - 1, d, hh, mm, 0);
  for (let i = 0; i < 2; i += 1) {
    const wall = wallPartsInZone(new Date(utcMs), timeZone);
    const asUtc = Date.UTC(wall.y, wall.m - 1, wall.d, wall.h, wall.min, 0);
    utcMs += Date.UTC(y, mo - 1, d, hh, mm, 0) - asUtc;
  }
  return new Date(utcMs);
}

export function isTrialSeatAdminReminderDue(input: {
  scheduledOn: string;
  startTime: string;
  timeZone: string;
  now: Date;
  reminderAlreadySent: boolean;
}): boolean {
  if (input.reminderAlreadySent) return false;
  const start = instituteZonedDateTimeUtc(
    input.scheduledOn,
    input.startTime,
    input.timeZone,
  );
  if (Number.isNaN(start.getTime())) return false;
  const horizon = new Date(input.now.getTime() + 60 * 60 * 1000);
  return start.getTime() > input.now.getTime() && start.getTime() <= horizon.getTime();
}

export function isTrialSeatAutoAbsentDue(input: {
  scheduledOn: string;
  timeZone: string;
  now: Date;
}): boolean {
  return instituteCalendarDateIso(input.now, input.timeZone) > input.scheduledOn;
}

export function addCalendarMonthsUtc(now: Date, months: number): Date {
  const d = new Date(now.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

export function nextInstituteDateIso(now: Date, timeZone: string): string {
  const { y, m, d } = instituteCalendarPartsInTimeZone(now, timeZone);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
}
