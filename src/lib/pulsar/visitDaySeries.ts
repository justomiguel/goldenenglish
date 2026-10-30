export type VisitDayPoint = {
  day: string;
  visits: number;
};

const SAFE_SCHEMA = /^[a-z_][a-z0-9_]*$/;

export const VISIT_SERIES_DAYS = 14;

export function hitsTableForSchema(schema: string): string | null {
  const name = schema.trim();
  if (!SAFE_SCHEMA.test(name)) return null;
  return `${name}.traffic_page_hits`;
}

export function fillVisitSeries(
  rows: readonly { day: string; visits: number }[],
  today: string,
  dayCount = VISIT_SERIES_DAYS,
): VisitDayPoint[] {
  const counts = new Map(rows.map((row) => [row.day, row.visits]));
  const start = new Date(`${today}T12:00:00Z`);
  const points: VisitDayPoint[] = [];
  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() - offset);
    const day = date.toISOString().slice(0, 10);
    points.push({ day, visits: counts.get(day) ?? 0 });
  }
  return points;
}

export function chartToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
