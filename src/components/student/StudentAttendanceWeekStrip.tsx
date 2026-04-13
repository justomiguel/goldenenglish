"use client";

import { dateKeyFromLocalDate } from "@/lib/attendance/dateKey";
import type { AttendanceRow } from "@/lib/attendance/stats";

function startOfWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const x = new Date(d);
  x.setDate(d.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export interface StudentAttendanceWeekStripProps {
  anchorDate: Date;
  rowByDate: Map<string, AttendanceRow>;
  labels: {
    present: string;
    absent: string;
    late: string;
    excused: string;
    noClass: string;
  };
}

export function StudentAttendanceWeekStrip({
  anchorDate,
  rowByDate,
  labels,
}: StudentAttendanceWeekStripProps) {
  const start = startOfWeekMonday(anchorDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  function tileClass(row: AttendanceRow | undefined): string {
    if (!row) return "border-[var(--color-border)] bg-[var(--color-muted)]/60";
    if (row.status === "present" || row.status === "late")
      return "border-[var(--color-success)] bg-[var(--color-success)]/25";
    if (row.status === "absent")
      return "border-[var(--color-error)] bg-[var(--color-error)]/20";
    return "border-[var(--color-warning)] bg-[var(--color-warning)]/25";
  }

  function statusLabel(row: AttendanceRow | undefined): string {
    if (!row) return labels.noClass;
    if (row.status === "present") return labels.present;
    if (row.status === "late") return labels.late;
    if (row.status === "absent") return labels.absent;
    return labels.excused;
  }

  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {days.map((d) => {
        const key = dateKeyFromLocalDate(d);
        const row = rowByDate.get(key);
        return (
          <div
            key={key}
            className={`flex min-h-[72px] flex-col rounded-[var(--layout-border-radius)] border p-2 text-center ${tileClass(row)}`}
          >
            <span className="text-[10px] font-semibold uppercase text-[var(--color-muted-foreground)]">
              {d.toLocaleDateString(undefined, { weekday: "short" })}
            </span>
            <span className="font-display text-lg font-bold text-[var(--color-primary)]">{d.getDate()}</span>
            <span className="mt-auto text-[10px] leading-tight text-[var(--color-muted-foreground)]">
              {statusLabel(row)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
