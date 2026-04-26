"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  PolarGrid,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from "recharts";
import { RechartsSizedFrame } from "@/components/molecules/RechartsSizedFrame";
import {
  formatHealthChartInt,
  HEALTH_CHART_TOOLTIP_CONTENT_STYLE,
  type HealthChartSlice,
} from "@/components/molecules/academicSectionHealthChartPlotShared";

export type { HealthChartSlice };

function HealthSliceTreemapInner({
  locale,
  slices,
}: {
  locale: string;
  slices: { name: string; size: number; fill: string }[];
}) {
  const data = slices.map((s) => ({
    name: s.name,
    size: Math.max(s.size, 1),
    displayValue: s.size,
    fill: s.fill,
  }));

  return (
    <RechartsSizedFrame height={192} className="w-full">
      {(w, h) => (
        <ResponsiveContainer width={w} height={h}>
          <Treemap
            width={w}
            height={h}
            data={data}
            dataKey="size"
            type="flat"
            aspectRatio={1}
            stroke="var(--color-border)"
            isAnimationActive={false}
          >
            <Tooltip
              contentStyle={HEALTH_CHART_TOOLTIP_CONTENT_STYLE}
              formatter={(_value, _name, props) => {
                const p = (props as { payload?: { displayValue?: number; name?: string } })?.payload;
                const n = typeof p?.displayValue === "number" ? p.displayValue : 0;
                return [formatHealthChartInt(locale, n), String(p?.name ?? "")];
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      )}
    </RechartsSizedFrame>
  );
}

/** Part-to-whole: one horizontal stacked bar (absolute counts). */
export function HealthAttendanceCompositionBar({ locale, data }: { locale: string; data: HealthChartSlice[] }) {
  const row: Record<string, number | string> = { rowId: "mix" };
  for (const s of data) row[s.key] = s.value;

  return (
    <RechartsSizedFrame height={192} className="w-full">
      {(w, h) => (
        <ResponsiveContainer width={w} height={h}>
          <BarChart layout="vertical" data={[row]} margin={{ left: 4, right: 12, top: 8, bottom: 8 }}>
            <XAxis type="number" tickFormatter={(v) => formatHealthChartInt(locale, v)} />
            <YAxis type="category" dataKey="rowId" width={4} hide tick={false} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={HEALTH_CHART_TOOLTIP_CONTENT_STYLE}
              formatter={(value) => formatHealthChartInt(locale, typeof value === "number" ? value : Number(value))}
            />
            {data.map((s) => (
              <Bar key={s.key} stackId="att" dataKey={s.key} fill={s.fill} name={s.name} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </RechartsSizedFrame>
  );
}

/** Composition of progress buckets on the polar axis. */
export function HealthTasksRadialBarChart({ locale, tasks }: { locale: string; tasks: HealthChartSlice[] }) {
  const rows = tasks.map((t) => ({ name: t.name, value: t.value, fill: t.fill }));

  return (
    <RechartsSizedFrame height={192} className="w-full">
      {(w, h) => (
        <ResponsiveContainer width={w} height={h}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="18%"
            outerRadius="100%"
            data={rows}
            startAngle={105}
            endAngle={-255}
            margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
          >
            <PolarGrid gridType="circle" stroke="var(--color-border)" />
            <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "var(--color-muted)" }} />
            <Tooltip
              formatter={(value) => formatHealthChartInt(locale, typeof value === "number" ? value : Number(value))}
              contentStyle={HEALTH_CHART_TOOLTIP_CONTENT_STYLE}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      )}
    </RechartsSizedFrame>
  );
}

/** Two-part capacity: area encodes magnitude (only two tiles). */
export function HealthCapacityTreemap({ locale, slices }: { locale: string; slices: HealthChartSlice[] }) {
  const mapped = slices.map((s) => ({ name: s.name, size: s.value, fill: s.fill }));
  return <HealthSliceTreemapInner locale={locale} slices={mapped} />;
}

/** Independent magnitudes (different units): column heights, not a treemap. */
export function HealthEngagementColumnsBarChart({
  locale,
  bars,
}: {
  locale: string;
  bars: { key: string; name: string; value: number; fill: string }[];
}) {
  const rows = bars.map((b) => ({ key: b.key, name: b.name, v: b.value, fill: b.fill }));

  return (
    <RechartsSizedFrame height={192} className="w-full">
      {(w, h) => (
        <ResponsiveContainer width={w} height={h}>
          <BarChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 36 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-14} textAnchor="end" height={44} />
            <YAxis tickFormatter={(v) => formatHealthChartInt(locale, v)} width={44} tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(value) => formatHealthChartInt(locale, typeof value === "number" ? value : Number(value))}
              contentStyle={HEALTH_CHART_TOOLTIP_CONTENT_STYLE}
            />
            <Bar dataKey="v" radius={[4, 4, 0, 0]}>
              {rows.map((e) => (
                <Cell key={e.key} fill={e.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </RechartsSizedFrame>
  );
}

/** Binary split of active students: donut is the most direct part-to-whole read. */
export function HealthPaymentsDonutChart({ locale, slices }: { locale: string; slices: HealthChartSlice[] }) {
  return (
    <RechartsSizedFrame height={192} className="w-full">
      {(w, h) => (
        <ResponsiveContainer width={w} height={h}>
          <PieChart>
            <Tooltip
              formatter={(value, name) => [
                formatHealthChartInt(locale, typeof value === "number" ? value : Number(value)),
                String(name),
              ]}
              contentStyle={HEALTH_CHART_TOOLTIP_CONTENT_STYLE}
            />
            <Pie data={slices} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={46} outerRadius={70} paddingAngle={2}>
              {slices.map((e) => (
                <Cell key={e.key} fill={e.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      )}
    </RechartsSizedFrame>
  );
}

/** Two comparable counts (published vs pending): horizontal bars, same scale. */
export function HealthAssessmentsRowsBarChart({ locale, assessments }: { locale: string; assessments: HealthChartSlice[] }) {
  return (
    <RechartsSizedFrame height={192} className="w-full">
      {(w, h) => (
        <ResponsiveContainer width={w} height={h}>
          <BarChart layout="vertical" data={assessments} margin={{ left: 4, right: 12, top: 8, bottom: 8 }}>
            <XAxis type="number" tickFormatter={(v) => formatHealthChartInt(locale, v)} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value) => formatHealthChartInt(locale, typeof value === "number" ? value : Number(value))}
              contentStyle={HEALTH_CHART_TOOLTIP_CONTENT_STYLE}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {assessments.map((e) => (
                <Cell key={e.key} fill={e.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </RechartsSizedFrame>
  );
}

/** Two flag counts: simple columns (distinct from radial tasks). */
export function HealthReadinessColumnsBarChart({ locale, readiness }: { locale: string; readiness: HealthChartSlice[] }) {
  const rows = readiness.map((r) => ({ key: r.key, label: r.name, v: r.value, fill: r.fill }));

  return (
    <RechartsSizedFrame height={192} className="w-full">
      {(w, h) => (
        <ResponsiveContainer width={w} height={h}>
          <BarChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 40 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={44} />
            <YAxis allowDecimals={false} tickFormatter={(v) => formatHealthChartInt(locale, v)} width={40} tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(value) => formatHealthChartInt(locale, typeof value === "number" ? value : Number(value))}
              contentStyle={HEALTH_CHART_TOOLTIP_CONTENT_STYLE}
            />
            <Bar dataKey="v" radius={[4, 4, 0, 0]}>
              {rows.map((e) => (
                <Cell key={e.key} fill={e.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </RechartsSizedFrame>
  );
}
