import type { Dispatch, SetStateAction } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

export interface AcademicSectionRosterMoveControlsProps {
  studentId: string;
  fullWidth: boolean;
  picks: Record<string, string>;
  setPicks: Dispatch<SetStateAction<Record<string, string>>>;
  moveTargets: { id: string; label: string }[];
  busy: boolean;
  movingStudentId: string | null;
  moveTitle: string;
  moveSelect: string;
  moveRun: string;
  onMove: (studentId: string) => void;
}

export function AcademicSectionRosterMoveControls({
  studentId,
  fullWidth,
  picks,
  setPicks,
  moveTargets,
  busy,
  movingStudentId,
  moveTitle,
  moveSelect,
  moveRun,
  onMove,
}: AcademicSectionRosterMoveControlsProps) {
  const moving = busy && movingStudentId === studentId;
  return (
    <div
      className={
        fullWidth
          ? "mt-2.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-[var(--color-border)]/60 pt-2.5"
          : "flex flex-wrap items-center gap-2"
      }
    >
      <select
        aria-label={moveTitle}
        className={`${fullWidth ? "w-full min-w-0" : "max-w-[14rem]"} rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5 text-xs text-[var(--color-foreground)]`}
        value={picks[studentId] ?? ""}
        onChange={(e) => setPicks((prev) => ({ ...prev, [studentId]: e.target.value }))}
        disabled={busy}
      >
        <option value="">{moveSelect}</option>
        {moveTargets.map((target) => (
          <option key={target.id} value={target.id}>
            {target.label}
          </option>
        ))}
      </select>
      <Button type="button" size="sm" disabled={busy || !picks[studentId]} isLoading={moving} onClick={() => onMove(studentId)}>
        {!moving ? <ArrowRightLeft className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {moveRun}
      </Button>
    </div>
  );
}

export function formatEnrollmentStatusLabel(
  status: string,
  labels: Dictionary["dashboard"]["academicSectionPage"]["lifecycle"]["enrollmentStatus"],
): string {
  if (status === "active") return labels.active;
  if (status === "dropped") return labels.dropped;
  if (status === "transferred") return labels.transferred;
  if (status === "completed") return labels.completed;
  return status;
}
