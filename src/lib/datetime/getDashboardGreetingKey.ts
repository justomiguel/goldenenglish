export type DashboardGreetingKey = "morning" | "afternoon" | "evening" | "night";

/** Returns the IANA-localized hour (0-23) for `now` in `timeZone`. */
export function getInstituteHour(now: Date, timeZone: string): number {
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hour12: false });
  const parts = fmt.formatToParts(now);
  const h = parts.find((p) => p.type === "hour")?.value ?? "0";
  const n = Number.parseInt(h, 10);
  if (!Number.isFinite(n) || n < 0 || n > 23) return 0;
  return n;
}

/** Time-of-day greeting key in the institute calendar (e.g. `analytics.timezone`). */
export function getDashboardGreetingKey(now: Date, timeZone: string): DashboardGreetingKey {
  const hour = getInstituteHour(now, timeZone);
  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 19) return "afternoon";
  return "evening";
}
