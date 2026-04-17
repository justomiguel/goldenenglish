"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Dictionary } from "@/types/i18n";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";
import type { TeacherAttendanceMatrixCells, TeacherAttendanceMatrixRow } from "@/types/teacherAttendanceMatrix";
import { cyclePatAdmin, cyclePatTeacher } from "@/lib/academics/attendanceMatrixCellCycle";
import { buildAttendanceMatrixMonthGroups } from "@/lib/academics/attendanceMatrixMonthGroups";
import { gridMoveFocus } from "@/lib/academics/teacherAttendanceMatrixNav";
import { TeacherAttendanceMatrixThead } from "@/components/organisms/TeacherAttendanceMatrixThead";
import type { AttendanceMatrixAutosaveVariant } from "@/hooks/useAttendanceMatrixAutosave";

const STATUS_SURFACE: Record<"present" | "absent" | "late", string> = {
  present: "bg-[var(--color-success)]/90 text-[var(--color-primary-foreground)] border-[var(--color-success)]",
  absent: "bg-[var(--color-error)]/90 text-[var(--color-primary-foreground)] border-[var(--color-error)]",
  late: "bg-[var(--color-warning)]/90 text-[var(--color-accent-foreground)] border-[var(--color-warning)]",
};

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
        const next = gridMoveFocus(rows, classDays, cells, focused, e.key);
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
    [applyPatKey, cells, focused, matrixMode, onFocusChange, rows, classDays],
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
        />
        <tbody>
          {rows.map((row) => {
            const inactive = row.enrollmentStatus === "dropped" || row.enrollmentStatus === "transferred";
            return (
              <tr
                key={row.enrollmentId}
                className={`border-b border-[var(--color-border)] ${inactive ? "opacity-55" : ""}`}
              >
                <th
                  scope="row"
                  className="sticky left-0 z-[1] bg-[var(--color-surface)] px-2 py-2 text-left text-xs font-medium text-[var(--color-foreground)]"
                >
                  {row.studentLabel}
                </th>
                {classDays.map((d) => {
                  const navigable = Object.prototype.hasOwnProperty.call(cells[row.enrollmentId] ?? {}, d);
                  if (!navigable) {
                    const label = dict.cellAria
                      .replace("{student}", row.studentLabel)
                      .replace("{date}", d);
                    return (
                      <td key={d} className="p-1 text-center">
                        <button
                          type="button"
                          data-att-cell={`${row.enrollmentId}|${d}`}
                          data-att-can-edit="false"
                          data-att-disabled-reason="not_enrolled_on_date"
                          tabIndex={-1}
                          disabled
                          aria-label={label}
                          title={dict.cellDisabledNotEnrolledOnDate}
                          className="touch-manipulation mx-auto flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 text-xs font-bold text-[var(--color-muted-foreground)] opacity-80"
                        >
                          ·
                        </button>
                      </td>
                    );
                  }
                  const v = cells[row.enrollmentId]![d]!;
                  const isExcused = v === "excused";
                  const isFocused = focused?.enrollmentId === row.enrollmentId && focused?.dateIso === d;
                  const blockInactive = matrixMode === "teacher" && inactive;
                  const blockExcusedReadonly = matrixMode === "teacher" && isExcused;
                  const dateEditable = isDateEditable(d);
                  const canEdit = dateEditable && !blockInactive && !blockExcusedReadonly;
                  const disabledReason = !canEdit
                    ? blockInactive
                      ? dict.cellDisabledInactive
                      : blockExcusedReadonly
                        ? dict.cellDisabledExcused
                        : !dateEditable
                          ? d > todayIso
                            ? dict.cellDisabledFuture
                            : dict.cellDisabledPast
                          : undefined
                    : undefined;
                  const label = dict.cellAria
                    .replace("{student}", row.studentLabel)
                    .replace("{date}", d);
                  const surface =
                    v === null
                      ? "border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/20 text-[var(--color-muted-foreground)]"
                      : isExcused
                        ? "border border-[var(--color-muted-foreground)] bg-[var(--color-muted)] text-[var(--color-foreground)]"
                        : STATUS_SURFACE[v];

                  return (
                    <td key={d} className="p-1 text-center">
                      <button
                        type="button"
                        data-att-cell={`${row.enrollmentId}|${d}`}
                        data-att-can-edit={String(canEdit)}
                        data-att-disabled-reason={
                          blockInactive
                            ? "inactive"
                            : blockExcusedReadonly
                              ? "excused"
                              : !dateEditable
                                ? d > todayIso
                                  ? "future"
                                  : "past_or_outside"
                                : ""
                        }
                        tabIndex={-1}
                        disabled={!canEdit}
                        aria-label={label}
                        title={disabledReason}
                        className={`touch-manipulation mx-auto flex h-9 w-9 items-center justify-center rounded-[var(--layout-border-radius)] text-xs font-bold transition ${surface} ${
                          isFocused ? "ring-2 ring-[var(--color-primary)] ring-offset-1 ring-offset-[var(--color-surface)]" : ""
                        } ${!canEdit ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:brightness-110"}`}
                        onClick={(e) => {
                          e.preventDefault();
                          wrapRef.current?.focus();
                          onFocusChange({ enrollmentId: row.enrollmentId, dateIso: d });
                          if (!canEdit) return;
                          const next =
                            matrixMode === "admin" ? cyclePatAdmin(v) : cyclePatTeacher(v);
                          onCellStatus(row.enrollmentId, d, next);
                        }}
                      >
                        {v === null ? "·" : isExcused ? dict.excusedLetter : v === "present" ? "P" : v === "absent" ? "A" : "T"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
