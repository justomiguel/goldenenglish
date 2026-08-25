export type AdminTrafficDailyRow = {
  day: string;
  authenticatedHits: number;
  guestHits: number;
  botHits: number;
};

export type AdminTrafficVisitsPoint = {
  day: string;
  visits: number;
};

type RawDailyRow = {
  day?: unknown;
  authenticated_hits?: unknown;
  guest_hits?: unknown;
  bot_hits?: unknown;
};

export function mapAdminTrafficDailyStacked(rows: unknown): AdminTrafficDailyRow[] {
  const list = (Array.isArray(rows) ? rows : []) as RawDailyRow[];
  return list.map((r) => ({
    day: String(r.day ?? "").slice(0, 10),
    authenticatedHits: Number(r.authenticated_hits ?? 0),
    guestHits: Number(r.guest_hits ?? 0),
    botHits: Number(r.bot_hits ?? 0),
  }));
}

/** Human visits for the hub line (matches Autenticados + Visitantes, not bots). */
export function trafficVisitsSeries(daily: AdminTrafficDailyRow[]): AdminTrafficVisitsPoint[] {
  return daily.map((r) => ({
    day: r.day,
    visits: r.authenticatedHits + r.guestHits,
  }));
}

export function trafficWeekOverWeekFromDaily(
  daily: AdminTrafficDailyRow[],
): { thisWeek: number; lastWeek: number } {
  const sorted = [...daily].sort((a, b) => a.day.localeCompare(b.day));
  const thisWeekDays = sorted.slice(-7);
  const lastWeekDays = sorted.slice(-14, -7);
  const sum = (rows: AdminTrafficDailyRow[]) =>
    rows.reduce((acc, r) => acc + r.authenticatedHits + r.guestHits + r.botHits, 0);
  return {
    thisWeek: sum(thisWeekDays),
    lastWeek: sum(lastWeekDays),
  };
}
