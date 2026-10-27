import type { Dispatch, SetStateAction } from "react";
import { AlertTriangle } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { AdminUserNameLink } from "@/components/molecules/AdminUserNameLink";
import { StudentCareBadge } from "@/components/molecules/StudentCareBadge";
import {
  AcademicSectionRosterMoveControls,
  formatEnrollmentStatusLabel,
} from "@/components/organisms/AcademicSectionRosterMoveControls";
import type { SectionRosterRow } from "@/types/sectionRoster";

export interface AcademicSectionRosterCardsProps {
  locale: string;
  rows: SectionRosterRow[];
  dict: Dictionary["dashboard"]["academicSectionPage"];
  debtByStudentId: Record<string, boolean>;
  canMove: boolean;
  picks: Record<string, string>;
  setPicks: Dispatch<SetStateAction<Record<string, string>>>;
  moveTargets: { id: string; label: string }[];
  busy: boolean;
  movingStudentId: string | null;
  onMove: (studentId: string) => void;
}

export function AcademicSectionRosterCards({
  locale,
  rows,
  dict,
  debtByStudentId,
  canMove,
  picks,
  setPicks,
  moveTargets,
  busy,
  movingStudentId,
  onMove,
}: AcademicSectionRosterCardsProps) {
  if (rows.length === 0) {
    return <p className="mt-3 py-4 text-sm text-[var(--color-muted-foreground)]">{dict.emptyTab}</p>;
  }

  return (
    <ul className="mt-3 space-y-2.5">
      {rows.map((row) => (
        <li
          key={row.enrollmentId}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5 font-medium text-[var(--color-foreground)]">
              <AdminUserNameLink locale={locale} userId={row.studentId} name={row.label} />
              {debtByStudentId[row.studentId] ? (
                <span
                  className="inline-flex shrink-0 rounded-full border border-[var(--color-error)] p-0.5 text-[var(--color-error)]"
                  title={dict.debtBadge}
                  aria-label={dict.debtBadge}
                >
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                </span>
              ) : null}
              {row.hasCareNotes ? <StudentCareBadge label={dict.careBadge} /> : null}
            </span>
            <span className="shrink-0 rounded-full bg-[var(--color-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-foreground)]">
              {formatEnrollmentStatusLabel(row.status, dict.lifecycle.enrollmentStatus)}
            </span>
          </div>
          {canMove ? (
            <AcademicSectionRosterMoveControls
              studentId={row.studentId}
              fullWidth
              picks={picks}
              setPicks={setPicks}
              moveTargets={moveTargets}
              busy={busy}
              movingStudentId={movingStudentId}
              moveTitle={dict.moveTitle}
              moveSelect={dict.moveSelect}
              moveRun={dict.moveRun}
              onMove={onMove}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
