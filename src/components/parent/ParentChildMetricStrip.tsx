import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import type { ParentChildMetric } from "@/lib/parent/buildParentChildMetrics";

type ChildCopy = Dictionary["dashboard"]["parent"]["childScreen"];

export interface ParentChildMetricStripProps {
  metrics: ParentChildMetric[];
  copy: ChildCopy;
  /** Destination per metric id, already carrying the focus params. */
  hrefById: Record<ParentChildMetric["id"], string>;
}

const TONE_CLASS: Record<ParentChildMetric["tone"], string> = {
  good: "text-[var(--color-success)]",
  warn: "text-[var(--color-warning)]",
  neutral: "text-[var(--color-foreground)]",
};

function labelFor(metric: ParentChildMetric, copy: ChildCopy): string {
  if (metric.id === "attendance") return copy.metricAttendance;
  if (metric.id === "average") return copy.metricAverage;
  return copy.metricPendingTasks;
}

function valueFor(metric: ParentChildMetric, copy: ChildCopy): string {
  if (metric.percent !== null) return `${metric.percent}%`;
  if (metric.count !== null) return String(metric.count);
  return copy.metricEmpty;
}

export function ParentChildMetricStrip({ metrics, copy, hrefById }: ParentChildMetricStripProps) {
  return (
    <ul className="m-0 grid grid-cols-3 gap-2 p-0">
      {metrics.map((metric) => {
        const hasValue = metric.percent !== null || metric.count !== null;
        return (
          <li key={metric.id}>
            <Link
              href={hrefById[metric.id]}
              className="flex min-h-[72px] flex-col justify-center gap-0.5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 transition hover:border-[var(--color-primary)]/60"
            >
              <span
                className={`font-display text-xl font-bold leading-none ${
                  hasValue ? TONE_CLASS[metric.tone] : "text-[var(--color-muted-foreground)]"
                } ${hasValue ? "" : "text-sm font-medium"}`}
              >
                {valueFor(metric, copy)}
              </span>
              <span className="text-xs font-medium leading-tight text-[var(--color-muted-foreground)]">
                {labelFor(metric, copy)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
