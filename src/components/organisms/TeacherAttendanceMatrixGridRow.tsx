"use client";

import type { RefObject } from "react";
import type { Dictionary } from "@/types/i18n";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";
import type { TeacherAttendanceMatrixCells, TeacherAttendanceMatrixRow } from "@/types/teacherAttendanceMatrix";
import { cyclePatAdmin, cyclePatTeacher } from "@/lib/academics/attendanceMatrixCellCycle";
import type { AttendanceMatrixAutosaveVariant } from "@/hooks/useAttendanceMatrixAutosave";

const STATUS_SURFACE: Record<"present" | "absent" | "late", string> = {
  present: "bg-[var(--color-success)]/90 text-[var(--color-primary-foreground)] border-[var(--color-success)]",
  absent: "bg-[var(--color-error)]/90 text-[var(--color-primary-foreground)] border-[var(--color-error)]",
  late: "bg-[var(--color-warning)]/90 text-[var(--color-accent-foreground)] border-[var(--color-warning)]",
};

export interface TeacherAttendanceMatrixGridRowProps {
  row: TeacherAttendanceMatrixRow;
  classDays: string[];
  cells: TeacherAttendanceMatrixCells;
  todayIso: string;
  focused: { enrollmentId: string; dateIso: string } | null;
  onFocusChange: (next: { enrollmentId: string; dateIso: string } | null) => void;
  onCellStatus: (enrollmentId: string, dateIso: string, status: SectionAttendanceStatusDb) => void;
  matrixMode: AttendanceMatrixAutosaveVariant;
  isDateEditable: (d: string) => boolean;
  wrapRef: RefObject<HTMLDivElement | null>;
  dict: Dictionary["dashboard"]["teacherSectionAttendance"]["matrix"];
}

export function TeacherAttendanceMatrixGridRow({
  row,
  classDays,
  cells,
  todayIso,
  focused,
  onFocusChange,
  onCellStatus,
  matrixMode,
  isDateEditable,
  wrapRef,
  dict,
}: TeacherAttendanceMatrixGridRowProps) {
  const inactive = row.enrollmentStatus === "dropped" || row.enrollmentStatus === "transferred";
  return (
    <tr className={`border-b border-[var(--color-border)] ${inactive ? "opacity-55" : ""}`}>
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
}
