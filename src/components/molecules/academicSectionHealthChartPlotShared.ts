export type HealthChartSlice = { key: string; name: string; value: number; fill: string };

export function formatHealthChartInt(locale: string, n: number) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
}

export const HEALTH_CHART_TOOLTIP_CONTENT_STYLE = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--layout-border-radius)",
} as const;
