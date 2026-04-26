"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Dictionary } from "@/types/i18n";
import { RechartsSizedFrame } from "@/components/molecules/RechartsSizedFrame";

export interface AcademicSectionHealthChartsProps {
  locale: string;
  dict: Dictionary["dashboard"]["academicSectionPage"]["health"];
  attendance: { key: string; name: string; value: number; fill: string }[];
  tasks: { key: string; name: string; value: number; fill: string }[];
}

function fmtInt(locale: string, n: number) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
}

export function AcademicSectionHealthCharts({ locale, dict, attendance, tasks }: AcademicSectionHealthChartsProps) {
  const attTotal = attendance.reduce((s, r) => s + r.value, 0);
  const taskTotal = tasks.reduce((s, r) => s + r.value, 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 p-4">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{dict.chartAttendanceTitle}</h3>
        {attTotal === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{dict.chartEmpty}</p>
        ) : (
          <div className="mt-3 h-52 w-full">
            <RechartsSizedFrame height={208} className="w-full">
              {(w, h) => (
                <ResponsiveContainer width={w} height={h}>
                  <PieChart>
                    <Tooltip
                      formatter={(value, name) => [fmtInt(locale, typeof value === "number" ? value : Number(value)), String(name)]}
                      contentStyle={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--layout-border-radius)",
                      }}
                    />
                    <Pie
                      data={attendance}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {attendance.map((e) => (
                        <Cell key={e.key} fill={e.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </RechartsSizedFrame>
          </div>
        )}
      </section>

      <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 p-4">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{dict.chartTasksTitle}</h3>
        {taskTotal === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{dict.chartEmpty}</p>
        ) : (
          <div className="mt-3 h-52 w-full">
            <RechartsSizedFrame height={208} className="w-full">
              {(w, h) => (
                <ResponsiveContainer width={w} height={h}>
                  <BarChart layout="vertical" data={tasks} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                    <XAxis type="number" tickFormatter={(v) => fmtInt(locale, v)} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => fmtInt(locale, typeof value === "number" ? value : Number(value))}
                      contentStyle={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--layout-border-radius)",
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {tasks.map((e) => (
                        <Cell key={e.key} fill={e.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </RechartsSizedFrame>
          </div>
        )}
      </section>
    </div>
  );
}
