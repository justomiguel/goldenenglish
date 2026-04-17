export type AdminAnalyticsHourlyRow = { hour: number; role: string; cnt: number };

const ROLE_KEYS = ["student", "parent", "teacher", "admin"] as const;

export type AdminAnalyticsHourlyChartRow = { hour: number } & Record<
  (typeof ROLE_KEYS)[number],
  number
>;

export function pivotAdminAnalyticsHourly(rows: AdminAnalyticsHourlyRow[]): AdminAnalyticsHourlyChartRow[] {
  const byHour = new Map<number, Record<string, number>>();
  for (const r of rows) {
    const h = r.hour;
    const cur = byHour.get(h) ?? { hour: h };
    cur[r.role] = Number(r.cnt);
    byHour.set(h, cur);
  }
  return Array.from({ length: 24 }, (_, hour) => {
    const base = byHour.get(hour) ?? { hour };
    const row: Record<string, number> = { hour };
    for (const k of ROLE_KEYS) {
      row[k] = Number(base[k] ?? 0);
    }
    return row as AdminAnalyticsHourlyChartRow;
  });
}
