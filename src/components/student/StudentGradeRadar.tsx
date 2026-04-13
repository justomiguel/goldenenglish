"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { StudentGradeRubricPoint } from "@/types/studentHub";

export interface StudentGradeRadarProps {
  title: string;
  ariaLabel: string;
  points: StudentGradeRubricPoint[];
}

export function StudentGradeRadar({ title, ariaLabel, points }: StudentGradeRadarProps) {
  const data = points.map((p) => ({
    subject: p.subjectLabel,
    pct: p.fullMark > 0 ? Math.round((p.value / p.fullMark) * 100) : 0,
  }));

  if (data.length < 3) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h4>
      <div className="h-[260px] w-full min-w-[200px] text-[var(--color-primary)]" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="72%"
            data={data}
            margin={{ top: 10, right: 12, bottom: 10, left: 12 }}
          >
            <PolarGrid stroke="var(--color-border)" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "var(--color-foreground)" }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
            <Radar name="pct" dataKey="pct" stroke="currentColor" fill="currentColor" fillOpacity={0.28} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
