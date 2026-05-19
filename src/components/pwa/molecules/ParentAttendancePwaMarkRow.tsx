import type { AttendanceRow } from "@/lib/attendance/stats";
import type { ParentAttendanceMark } from "@/lib/parent/loadParentRecentAttendance";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["parent"]["attendancePwa"];

export interface ParentAttendancePwaMarkRowProps {
  mark: ParentAttendanceMark;
  locale: string;
  labels: Labels;
  showChildName?: boolean;
}

function statusLabel(status: AttendanceRow["status"], labels: Labels): string {
  switch (status) {
    case "present":
      return labels.statusPresent;
    case "absent":
      return labels.statusAbsent;
    case "late":
      return labels.statusLate;
    case "excused":
      return labels.statusExcused;
    default:
      return status;
  }
}

function rowSurface(status: AttendanceRow["status"]): string {
  if (status === "absent") {
    return "border-[var(--color-error)] bg-[color-mix(in_oklch,var(--color-error)_12%,var(--color-surface))]";
  }
  if (status === "late") {
    return "border-[var(--color-warning)] bg-[color-mix(in_oklch,var(--color-warning)_10%,var(--color-surface))]";
  }
  if (status === "present") {
    return "border-[var(--color-success)]/35 bg-[color-mix(in_oklch,var(--color-success)_8%,var(--color-surface))]";
  }
  return "border-[var(--color-border)] bg-[var(--color-surface)]";
}

export function ParentAttendancePwaMarkRow({
  mark,
  locale,
  labels,
  showChildName = false,
}: ParentAttendancePwaMarkRowProps) {
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${mark.attendedOn}T12:00:00`));

  const absent = mark.status === "absent";

  return (
    <li
      className={`rounded-[var(--layout-border-radius)] border-s-4 px-3 py-3 ${rowSurface(mark.status)}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">{dateLabel}</p>
          {showChildName ? (
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">{mark.studentName}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide ${
            absent
              ? "bg-[var(--color-error)] text-[var(--color-surface)]"
              : mark.status === "present" || mark.status === "late"
                ? "bg-[var(--color-success)] text-[var(--color-surface)]"
                : "bg-[var(--color-muted)] text-[var(--color-foreground)]"
          }`}
        >
          {absent ? labels.absentHighlight : statusLabel(mark.status, labels)}
        </span>
      </div>
    </li>
  );
}
