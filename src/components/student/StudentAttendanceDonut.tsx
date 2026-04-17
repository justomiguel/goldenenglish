"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Dictionary } from "@/types/i18n";
import type { AttendanceRow } from "@/lib/attendance/stats";
import { attendanceStats } from "@/lib/attendance/stats";
import { RechartsSizedFrame } from "@/components/molecules/RechartsSizedFrame";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export interface StudentAttendanceDonutProps {
  locale: string;
  rows: AttendanceRow[];
  dict: Dictionary["dashboard"]["student"]["attendanceDonut"];
}

function formatMoneyLike(locale: string, n: number) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
}

export function StudentAttendanceDonut({ locale, rows, dict }: StudentAttendanceDonutProps) {
  const reduced = usePrefersReducedMotion();
  const s = attendanceStats(rows);
  const attended = s.present + s.late + s.excused;
  const absent = s.absent;
  const data =
    s.total === 0
      ? []
      : [
          { key: "attended", name: dict.segmentAttended, value: attended },
          { key: "absent", name: dict.segmentAbsent, value: absent },
        ];
  const fills: Record<string, string> = {
    attended: "var(--color-primary)",
    absent: "var(--color-muted-foreground)",
  };

  const labelCounts = dict.ariaSummary
    .replace("{attended}", String(attended))
    .replace("{absent}", String(absent))
    .replace("{total}", String(s.total));

  if (s.total === 0) {
    return (
      <section aria-label={dict.title} className="mb-8 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">{dict.title}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>
      </section>
    );
  }

  return (
    <section aria-label={dict.title} className="mb-8 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-foreground)]">{dict.title}</h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.lead}</p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
        <div className="h-48 w-full max-w-[220px]" role="img" aria-label={labelCounts}>
          <RechartsSizedFrame height={192} className="w-full max-w-[220px]">
            {(w, h) => (
              <ResponsiveContainer width={w} height={h}>
                <PieChart>
                  <Tooltip
                    formatter={(value, name) => [
                      formatMoneyLike(locale, typeof value === "number" ? value : Number(value)),
                      String(name),
                    ]}
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--layout-border-radius)",
                    }}
                  />
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={2}
                    isAnimationActive={!reduced}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.key} fill={fills[entry.key] ?? "var(--color-muted)"} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </RechartsSizedFrame>
        </div>
        <ul className="text-sm text-[var(--color-foreground)]">
          <li>
            <span className="font-medium text-[var(--color-primary)]">{dict.segmentAttended}:</span>{" "}
            {attended} ({Math.round((100 * attended) / s.total)}%)
          </li>
          <li className="mt-1">
            <span className="font-medium text-[var(--color-muted-foreground)]">{dict.segmentAbsent}:</span>{" "}
            {absent} ({Math.round((100 * absent) / s.total)}%)
          </li>
        </ul>
      </div>
    </section>
  );
}
