"use client";

import { useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Button } from "@/components/atoms/Button";
import { StudentAttendanceWeekStrip } from "@/components/student/StudentAttendanceWeekStrip";
import { dateKeyFromLocalDate } from "@/lib/attendance/dateKey";
import { mandatoryAttendanceStatsForMonth } from "@/lib/attendance/stats";
import type { AttendanceRow } from "@/lib/attendance/stats";
import type { Dictionary } from "@/types/i18n";

type StudentCalLabels = Dictionary["dashboard"]["student"];

export interface StudentAttendanceCalendarProps {
  rows: AttendanceRow[];
  labels: StudentCalLabels;
}

export function StudentAttendanceCalendar({ rows, labels }: StudentAttendanceCalendarProps) {
  const [mode, setMode] = useState<"month" | "week">("month");
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const monthStart = useMemo(
    () => new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1),
    [cursorDate],
  );

  const rowByDate = useMemo(() => {
    const m = new Map<string, AttendanceRow>();
    for (const r of rows) {
      const k = r.attendance_date.slice(0, 10);
      m.set(k, r);
    }
    return m;
  }, [rows]);

  const y = cursorDate.getFullYear();
  const mo = cursorDate.getMonth() + 1;
  const { present, total } = mandatoryAttendanceStatsForMonth(rows, y, mo);

  return (
    <section
      className="student-attendance-calendar space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4"
      aria-label={labels.calendarTitle}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
          {labels.calendarTitle}
        </h2>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "month" ? "primary" : "ghost"}
            onClick={() => setMode("month")}
          >
            {labels.viewMonth}
          </Button>
          <Button
            type="button"
            variant={mode === "week" ? "primary" : "ghost"}
            onClick={() => setMode("week")}
          >
            {labels.viewWeek}
          </Button>
        </div>
      </div>

      <p className="text-sm text-[var(--color-muted-foreground)]">
        <span className="font-semibold text-[var(--color-foreground)]">{labels.mandatoryMonthTitle}</span>{" "}
        {labels.mandatoryMonthMeta.replace("{{present}}", String(present)).replace("{{total}}", String(total))}
      </p>

      {mode === "month" ? (
        <Calendar
          calendarType="iso8601"
          value={cursorDate}
          activeStartDate={monthStart}
          onChange={(v) => {
            if (v instanceof Date) setCursorDate(v);
          }}
          onActiveStartDateChange={({ activeStartDate }) => {
            if (activeStartDate) setCursorDate(activeStartDate);
          }}
          tileClassName={({ date, view }) => {
            if (view !== "month") return null;
            const key = dateKeyFromLocalDate(date);
            const row = rowByDate.get(key);
            if (!row) return null;
            if (row.status === "present") return "attendance-present";
            if (row.status === "absent") return "attendance-absent";
            return "attendance-justified";
          }}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const d = new Date(cursorDate);
                d.setDate(d.getDate() - 7);
                setCursorDate(d);
              }}
            >
              {labels.weekPrev}
            </Button>
            <span className="text-sm font-medium text-[var(--color-foreground)]">
              {labels.weekOf}{" "}
              {cursorDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const d = new Date(cursorDate);
                d.setDate(d.getDate() + 7);
                setCursorDate(d);
              }}
            >
              {labels.weekNext}
            </Button>
          </div>
          <StudentAttendanceWeekStrip
            anchorDate={cursorDate}
            rowByDate={rowByDate}
            labels={{
              present: labels.legendPresent,
              absent: labels.legendAbsent,
              justified: labels.legendJustified,
              noClass: labels.legendNoRecord,
            }}
          />
        </div>
      )}

      <ul className="flex flex-wrap gap-4 text-xs text-[var(--color-muted-foreground)]">
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-[var(--color-success)]" /> {labels.legendPresent}
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-[var(--color-error)]" /> {labels.legendAbsent}
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-[var(--color-warning)]" /> {labels.legendJustified}
        </li>
      </ul>
    </section>
  );
}
