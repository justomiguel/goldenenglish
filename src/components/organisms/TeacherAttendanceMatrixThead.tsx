"use client";

import { CheckCheck, Loader2 } from "lucide-react";
import type { AttendanceMatrixMonthGroup } from "@/lib/academics/attendanceMatrixMonthGroups";
import type { Dictionary } from "@/types/i18n";
import { SortableColumnHeader } from "@/components/molecules/SortableColumnHeader";
import type { UniversalListSortLabels, UniversalSortDir } from "@/types/universalListView";

export interface TeacherAttendanceMatrixTheadProps {
  dict: Dictionary["dashboard"]["teacherSectionAttendance"]["matrix"];
  monthGroups: AttendanceMatrixMonthGroup[];
  theadDepth: number;
  classDays: string[];
  todayIso: string;
  holidayLabels: Record<string, string>;
  dayFormatter: Intl.DateTimeFormat;
  onColumnFill?: (dateIso: string) => void;
  columnBusyDate?: string | null;
  isDateEditable: (d: string) => boolean;
  studentSortKey?: string;
  studentSortDir?: UniversalSortDir;
  onToggleStudentSort?: (columnId: string) => void;
  studentSortLabels?: UniversalListSortLabels;
}

export function TeacherAttendanceMatrixThead({
  dict,
  monthGroups,
  theadDepth,
  classDays,
  todayIso,
  holidayLabels,
  dayFormatter,
  onColumnFill,
  columnBusyDate,
  isDateEditable,
  studentSortKey,
  studentSortDir,
  onToggleStudentSort,
  studentSortLabels,
}: TeacherAttendanceMatrixTheadProps) {
  const studentSortable = Boolean(
    onToggleStudentSort && studentSortLabels && studentSortKey != null && studentSortDir != null,
  );
  return (
    <thead className="sticky top-0 z-[2] bg-[var(--color-muted)]/90 backdrop-blur-sm">
      <tr className="border-b border-[var(--color-border)]">
        <th
          rowSpan={theadDepth}
          scope="col"
          className="sticky left-0 z-[4] min-w-[10rem] bg-[var(--color-muted)] px-2 py-2 align-middle text-xs font-semibold text-[var(--color-foreground)]"
          aria-sort={
            studentSortable && studentSortKey === "student"
              ? studentSortDir === "asc"
                ? "ascending"
                : "descending"
              : "none"
          }
        >
          {studentSortable ? (
            <SortableColumnHeader
              columnId="student"
              label={dict.colStudent}
              sortKey={studentSortKey!}
              sortDir={studentSortDir!}
              onToggleSort={onToggleStudentSort!}
              sortLabels={studentSortLabels!}
            />
          ) : (
            dict.colStudent
          )}
        </th>
        {monthGroups.map((g) => (
          <th
            key={g.key}
            scope="colgroup"
            colSpan={g.span}
            className="border-b border-[var(--color-border)] px-1 py-1.5 text-center text-[11px] font-semibold capitalize tracking-wide text-[var(--color-muted-foreground)]"
          >
            {g.label}
          </th>
        ))}
      </tr>
      <tr className="border-b border-[var(--color-border)]">
        {classDays.map((d) => {
          const isPast = d < todayIso;
          const isFuture = d > todayIso;
          const hol = Boolean(holidayLabels[d]);
          return (
            <th
              key={d}
              id={`teacher-att-col-${d}`}
              scope="col"
              className={`min-w-[3rem] px-1 py-2 text-center text-xs font-medium ${
                d === todayIso ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]"
              } ${isPast ? "bg-[var(--color-muted)]/50" : ""} ${isFuture ? "opacity-70" : ""}`}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span>{dayFormatter.format(new Date(`${d}T12:00:00.000Z`))}</span>
                {hol ? (
                  <span className="text-[10px] font-normal text-[var(--color-warning)]" title={holidayLabels[d]}>
                    !
                  </span>
                ) : null}
              </div>
            </th>
          );
        })}
      </tr>
      {onColumnFill ? (
        <tr className="border-b border-[var(--color-border)]">
          {classDays.map((d) => {
            const canBulk = isDateEditable(d);
            const busy = columnBusyDate === d;
            return (
              <th key={`fill-${d}`} className="px-1 py-1 text-center">
                <button
                  type="button"
                  disabled={!canBulk || busy}
                  title={!canBulk ? dict.columnFillDisabled : dict.columnFillTooltip}
                  aria-label={dict.columnFillAria.replace("{date}", d)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => onColumnFill(d)}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <CheckCheck className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </th>
            );
          })}
        </tr>
      ) : null}
    </thead>
  );
}
