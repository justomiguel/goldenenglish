import { instituteCalendarDateIso } from "@/lib/datetime/instituteCalendarDateIso";

function addUtcDays(dateIso: string, days: number): string {
  const [y, mo, d] = dateIso.split("-").map(Number);
  const next = new Date(Date.UTC(y, mo - 1, d + days));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

function weekday0SunInTimeZone(now: Date, timeZone: string): number {
  const long = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).format(now);
  const names = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ] as const;
  const i = names.indexOf(long as (typeof names)[number]);
  return i === -1 ? now.getUTCDay() : i;
}

function minutesSinceMidnightInTimeZone(now: Date, timeZone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

function parseStartMinutes(startTime: string): number {
  const [h, m] = startTime.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

/**
 * Next ISO date (`YYYY-MM-DD`) of `dayOfWeek` + `startTime` in `timeZone`.
 * `dayOfWeek` is 0=Sunday. If that slot has not started yet today, returns today.
 */
export function nextTrialScheduledOn(
  now: Date,
  dayOfWeek: number,
  startTime: string,
  timeZone: string,
): string {
  const today = instituteCalendarDateIso(now, timeZone);
  const todayWeekday = weekday0SunInTimeZone(now, timeZone);
  const delta = (dayOfWeek - todayWeekday + 7) % 7;
  if (delta === 0) {
    const nowMinutes = minutesSinceMidnightInTimeZone(now, timeZone);
    if (nowMinutes < parseStartMinutes(startTime)) return today;
    return addUtcDays(today, 7);
  }
  return addUtcDays(today, delta);
}
