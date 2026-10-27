"use client";

import { useState } from "react";
import type { Dictionary } from "@/types/i18n";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";
import type { TeacherAttendanceMatrixCells, TeacherAttendanceMatrixRow } from "@/types/teacherAttendanceMatrix";
import { cyclePatAdmin, cyclePatTeacher } from "@/lib/academics/attendanceMatrixCellCycle";
import { defaultFocusColumnId } from "@/lib/dashboard/projectMatrixFocus";
import type { AttendanceMatrixAutosaveVariant } from "@/hooks/useAttendanceMatrixAutosave";
import { Label } from "@/components/atoms/Label";
import { AdminUserNameLink } from "@/components/molecules/AdminUserNameLink";

const STATUS_SURFACE: Record<"present" | "absent" | "late", string> = {
  present: "bg-[var(--color-success)] text-[var(--color-primary-foreground)]",
  absent: "bg-[var(--color-error)] text-[var(--color-primary-foreground)]",
  late: "bg-[var(--color-warning)] text-[var(--color-accent-foreground)]",
};

export interface TeacherAttendanceMatrixMobileProps {
  rows: TeacherAttendanceMatrixRow[];
  classDays: string[];
  cells: TeacherAttendanceMatrixCells;
  todayIso: string;
  editableByDate: Record<string, boolean>;
  onCellStatus: (enrollmentId: string, dateIso: string, status: SectionAttendanceStatusDb) => void;
  matrixMode: AttendanceMatrixAutosaveVariant;
  locale: string;
  dict: Dictionary["dashboard"]["teacherSectionAttendance"]["matrix"];
}

function letter(
  value: SectionAttendanceStatusDb | null,
  dict: TeacherAttendanceMatrixMobileProps["dict"],
): string {
  if (value === null) return "·";
  if (value === "excused") return dict.excusedLetter;
  if (value === "present") return "P";
  if (value === "absent") return "A";
  return "T";
}

/** One class day at a time, with a 44px status control per student. */
export function TeacherAttendanceMatrixMobile({
  rows,
  classDays,
  cells,
  todayIso,
  editableByDate,
  onCellStatus,
  matrixMode,
  locale,
  dict,
}: TeacherAttendanceMatrixMobileProps) {
  const [dateIso, setDateIso] = useState(() => defaultFocusColumnId(classDays, todayIso) ?? classDays[0] ?? "");

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="attendance-mobile-date">{dict.mobileDateLabel}</Label>
        <select
          id="attendance-mobile-date"
          className="min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
          value={dateIso}
          onChange={(event) => setDateIso(event.target.value)}
        >
          {classDays.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => {
          const value = cells[row.enrollmentId]?.[dateIso] ?? null;
          const navigable = Object.prototype.hasOwnProperty.call(cells[row.enrollmentId] ?? {}, dateIso);
          const inactive = row.enrollmentStatus === "dropped" || row.enrollmentStatus === "transferred";
          const canEdit =
            navigable &&
            editableByDate[dateIso] !== false &&
            !(matrixMode === "teacher" && (inactive || value === "excused"));
          const surface =
            value === null || value === "excused"
              ? "border border-[var(--color-border)] bg-[var(--color-muted)]"
              : STATUS_SURFACE[value];
          return (
            <li
              key={row.enrollmentId}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            >
              <span className="min-w-0 break-words text-sm font-medium text-[var(--color-foreground)]">
                {matrixMode === "admin" && row.studentId ? (
                  <AdminUserNameLink locale={locale} userId={row.studentId} name={row.studentLabel} />
                ) : (
                  row.studentLabel
                )}
              </span>
              <button
                type="button"
                disabled={!canEdit}
                className={`inline-flex h-11 min-w-11 items-center justify-center rounded-[var(--layout-border-radius)] px-3 text-sm font-bold ${surface}`}
                aria-label={dict.cellAria.replace("{student}", row.studentLabel).replace("{date}", dateIso)}
                onClick={() => {
                  if (!canEdit) return;
                  const next = matrixMode === "admin" ? cyclePatAdmin(value) : cyclePatTeacher(value);
                  onCellStatus(row.enrollmentId, dateIso, next);
                }}
              >
                {letter(value, dict)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
