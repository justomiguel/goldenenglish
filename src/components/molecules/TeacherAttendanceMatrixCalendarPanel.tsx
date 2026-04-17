"use client";

import { useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import type { Dictionary } from "@/types/i18n";

function toLocalDateIso(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

export interface TeacherAttendanceMatrixCalendarPanelProps {
  locale: string;
  classDays: string[];
  /** Preformatted line (e.g. lead + slots), or empty. */
  scheduleLine: string;
  dict: Dictionary["dashboard"]["teacherSectionAttendance"]["matrix"];
  onPickClassDay: (dateIso: string) => void;
}

export function TeacherAttendanceMatrixCalendarPanel({
  locale,
  classDays,
  scheduleLine,
  dict,
  onPickClassDay,
}: TeacherAttendanceMatrixCalendarPanelProps) {
  const classSet = useMemo(() => new Set(classDays), [classDays]);
  const [cursor, setCursor] = useState(() => {
    const last = classDays[classDays.length - 1];
    if (last) return new Date(`${last}T12:00:00`);
    return new Date();
  });

  const monthStart = useMemo(
    () => new Date(cursor.getFullYear(), cursor.getMonth(), 1),
    [cursor],
  );

  return (
    <section
      className="teacher-attendance-matrix-calendar space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
      aria-label={dict.calendarTitle}
    >
      <h2 className="text-base font-semibold text-[var(--color-foreground)]">{dict.calendarTitle}</h2>
      {scheduleLine ? <p className="text-xs text-[var(--color-muted-foreground)]">{scheduleLine}</p> : null}
      <p className="text-xs text-[var(--color-muted-foreground)]">{dict.calendarHint}</p>
      <Calendar
        calendarType="iso8601"
        locale={locale}
        value={cursor}
        activeStartDate={monthStart}
        onChange={(v) => {
          if (!(v instanceof Date)) return;
          const iso = toLocalDateIso(v);
          if (classSet.has(iso)) onPickClassDay(iso);
          setCursor(v);
        }}
        onActiveStartDateChange={({ activeStartDate }) => {
          if (activeStartDate) setCursor(activeStartDate);
        }}
        tileDisabled={({ date, view }) => view === "month" && !classSet.has(toLocalDateIso(date))}
        tileClassName={({ date, view }) => {
          if (view !== "month") return null;
          return classSet.has(toLocalDateIso(date)) ? "teacher-att-cal-classday" : null;
        }}
      />
    </section>
  );
}
