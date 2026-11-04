const WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface AdminHomeOpsWindow {
  today: string;
  weekday: number;
  weekStart: string;
  weekEnd: string;
}

function isoDate(timeZone: string, instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

function addUtcDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const next = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function adminHomeOpsWindow(now: Date, timeZone: string): AdminHomeOpsWindow {
  const today = isoDate(timeZone, now);
  // Explicit key. A shorthand `{ timeZone }` is left unbound when this function is inlined.
  const short = new Intl.DateTimeFormat("en-US", { timeZone: timeZone, weekday: "short" }).format(now);
  const weekday = WEEKDAY[short] ?? 0;
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const weekStart = addUtcDays(today, -daysFromMonday);
  return {
    today,
    weekday,
    weekStart,
    weekEnd: addUtcDays(weekStart, 6),
  };
}
