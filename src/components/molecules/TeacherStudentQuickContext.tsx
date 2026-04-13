"use client";

import type { Dictionary } from "@/types/i18n";
import type { TeacherAttendancePreviewRow } from "@/types/teacherPortal";
import { TeacherSuggestionShell } from "@/components/molecules/TeacherSuggestionShell";
import { Button } from "@/components/atoms/Button";

export type { TeacherAttendancePreviewRow } from "@/types/teacherPortal";

export interface TeacherStudentQuickContextProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  studentLabel: string;
  dict: Dictionary["dashboard"]["teacherMySections"];
  attendanceRows: TeacherAttendancePreviewRow[];
}

export function TeacherStudentQuickContext({
  open,
  onOpenChange,
  titleId,
  studentLabel,
  dict,
  attendanceRows,
}: TeacherStudentQuickContextProps) {
  return (
    <TeacherSuggestionShell
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      title={studentLabel}
    >
      <p className="text-sm text-[var(--color-muted-foreground)]">{dict.quickContextLead}</p>
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
          {dict.quickContextAttendanceHeading}
        </h3>
        {attendanceRows.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{dict.quickContextEmptyAttendance}</p>
        ) : (
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-sm">
            {attendanceRows.map((r) => (
              <li
                key={`${r.date}-${r.status}`}
                className="flex justify-between gap-2 border-b border-[var(--color-border)] pb-2 text-[var(--color-foreground)] last:border-0"
              >
                <span>{r.date}</span>
                <span className="text-[var(--color-muted-foreground)]">{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">{dict.quickContextGradesNote}</p>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          {dict.quickContextClose}
        </Button>
      </div>
    </TeacherSuggestionShell>
  );
}
