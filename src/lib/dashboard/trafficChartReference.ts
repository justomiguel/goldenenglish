import type { AdminTrafficVisitsPoint } from "@/lib/dashboard/mapAdminTrafficDailyStacked";

export function trafficChartReference(series: AdminTrafficVisitsPoint[]) {
  if (series.length === 0) {
    return { min: 0, max: 0, firstDay: "", lastDay: "" };
  }
  const visits = series.map((p) => p.visits);
  return {
    min: Math.min(...visits),
    max: Math.max(...visits),
    firstDay: series[0].day,
    lastDay: series[series.length - 1].day,
  };
}

export function formatTrafficChartDay(day: string, locale: string): string {
  const d = new Date(`${day}T12:00:00`);
  if (!Number.isFinite(d.getTime())) return day;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d);
}
