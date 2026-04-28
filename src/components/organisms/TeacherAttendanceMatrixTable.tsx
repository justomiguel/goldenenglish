"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/types/i18n";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";
import type { TeacherAttendanceMatrixCells, TeacherAttendanceMatrixRow } from "@/types/teacherAttendanceMatrix";
import { buildAttendanceMatrixMonthGroups } from "@/lib/academics/attendanceMatrixMonthGroups";
import { gridMoveFocus } from "@/lib/academics/teacherAttendanceMatrixNav";
import { TeacherAttendanceMatrixThead } from "@/components/organisms/TeacherAttendanceMatrixThead";
import { TeacherAttendanceMatrixGridRow } from "@/components/organisms/TeacherAttendanceMatrixGridRow";
import type { AttendanceMatrixAutosaveVariant } from "@/hooks/useAttendanceMatrixAutosave";
import type { UniversalSortDir } from "@/types/universalListView";

export interface TeacherAttendanceMatrixTableProps {
  locale: string;
  rows: TeacherAttendanceMatrixRow[];
  classDays: string[];
  cells: TeacherAttendanceMatrixCells;
  /** ISO date -> teacher may edit (RLS + section rules). */
  editableByDate: Record<string, boolean>;
  todayIso: string;
  holidayLabels: Record<string, string>;
  focused: { enrollmentId: string; dateIso: string } | null;
  onFocusChange: (next: { enrollmentId: string; dateIso: string } | null) => void;
  onCellStatus: (enrollmentId: string, dateIso: string, status: SectionAttendanceStatusDb) => void;
  onColumnFill?: (dateIso: string) => void;
  columnBusyDate?: string | null;
  dict: Dictionary["dashboard"]["teacherSectionAttendance"]["matrix"];
  matrixMode?: AttendanceMatrixAutosaveVariant;
}

export function TeacherAttendanceMatrixTable({
  locale,
  rows,
  classDays,
  cells,
  editableByDate,
  todayIso,
  holidayLabels,
  focused,
  onFocusChange,
  onCellStatus,
  onColumnFill,
  columnBusyDate,
  dict,
  matrixMode = "teacher",
}: TeacherAttendanceMatrixTableProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dfShort = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric" }), [locale]);
  const studentSortLabels = dict.studentColumnSort;
  const [studentSortDir, setStudentSortDir] = useState<UniversalSortDir>("asc");
  const sortedRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          a.studentLabel.localeCompare(b.studentLabel, undefined, { sensitivity: "base" }) *
          (studentSortDir === "asc" ? 1 : -1),
      ),
    [rows, studentSortDir],
  );
  const onToggleStudentSort = useCallback((columnId: string) => {
    if (columnId !== "student") return;
    setStudentSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }, []);

  const isDateEditable = useCallback(
    (d: string) => (matrixMode === "admin" ? editableByDate[d] !== false : Boolean(editableByDate[d])),
    [editableByDate, matrixMode],
  );

  const monthGroups = useMemo(() => buildAttendanceMatrixMonthGroups(classDays, locale), [classDays, locale]);
  const theadDepth = onColumnFill ? 3 : 2;

  useEffect(() => {
    if (!focused || !wrapRef.current) return;
    wrapRef.current
      .querySelector<HTMLElement>(`[data-att-cell="${focused.enrollmentId}|${focused.dateIso}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [focused]);

  const applyPatKey = useCallback(
    (code: "present" | "absent" | "late" | "excused") => {
      if (!focused) return;
      const v = cells[focused.enrollmentId]?.[focused.dateIso];
      if (v === undefined) return;
      if (matrixMode === "teacher" && v === "excused") return;
      if (!isDateEditable(focused.dateIso)) return;
      onCellStatus(focused.enrollmentId, focused.dateIso, code);
    },
    [cells, focused, isDateEditable, matrixMode, onCellStatus],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!focused) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const next = gridMoveFocus(sortedRows, classDays, cells, focused, e.key);
        if (next) {
          e.preventDefault();
          onFocusChange(next);
        }
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "p" || k === "a" || k === "t" || (matrixMode === "admin" && k === "e")) {
        e.preventDefault();
        if (k === "e") applyPatKey("excused");
        else applyPatKey(k === "p" ? "present" : k === "a" ? "absent" : "late");
      }
    },
    [applyPatKey, cells, focused, matrixMode, onFocusChange, sortedRows, classDays],
  );

  return (
    <div
      ref={wrapRef}
      role="grid"
      aria-label={dict.gridAria}
      tabIndex={0}
      className="max-h-[min(70vh,560px)] overflow-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      onKeyDown={onKeyDown}
    >
      <table className="min-w-max border-collapse text-left text-sm">
        <TeacherAttendanceMatrixThead
          dict={dict}
          monthGroups={monthGroups}
          theadDepth={theadDepth}
          classDays={classDays}
          todayIso={todayIso}
          holidayLabels={holidayLabels}
          dayFormatter={dfShort}
          onColumnFill={onColumnFill}
          columnBusyDate={columnBusyDate}
          isDateEditable={isDateEditable}
          studentSortKey="student"
          studentSortDir={studentSortDir}
          onToggleStudentSort={onToggleStudentSort}
          studentSortLabels={studentSortLabels}
        />
        <tbody>
          {sortedRows.map((row) => (
            <TeacherAttendanceMatrixGridRow
              key={row.enrollmentId}
              row={row}
              classDays={classDays}
              cells={cells}
              todayIso={todayIso}
              focused={focused}
              onFocusChange={onFocusChange}
              onCellStatus={onCellStatus}
              matrixMode={matrixMode}
              isDateEditable={isDateEditable}
              wrapRef={wrapRef}
              dict={dict}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
