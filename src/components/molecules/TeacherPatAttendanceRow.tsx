"use client";

import type { Dictionary } from "@/types/i18n";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";

export type TeacherPatClickable = "present" | "absent" | "late";

export interface TeacherPatAttendanceRowProps {
  label: string;
  value: SectionAttendanceStatusDb;
  onChange: (next: TeacherPatClickable) => void;
  dict: Dictionary["dashboard"]["teacherSectionAttendance"]["patShortLabels"];
}

export function TeacherPatAttendanceRow({ label, value, onChange, dict }: TeacherPatAttendanceRowProps) {
  const opts: { code: TeacherPatClickable; letter: string; label: string; className: string }[] = [
    {
      code: "present",
      letter: dict.presentLetter,
      label: dict.presentLabel,
      className:
        "border-[var(--color-success)] data-[pressed=true]:bg-[var(--color-success)] data-[pressed=true]:text-[var(--color-primary-foreground)]",
    },
    {
      code: "absent",
      letter: dict.absentLetter,
      label: dict.absentLabel,
      className:
        "border-[var(--color-error)] data-[pressed=true]:bg-[var(--color-error)] data-[pressed=true]:text-[var(--color-primary-foreground)]",
    },
    {
      code: "late",
      letter: dict.lateLetter,
      label: dict.lateLabel,
      className:
        "border-[var(--color-warning)] data-[pressed=true]:bg-[var(--color-warning)] data-[pressed=true]:text-[var(--color-accent-foreground)]",
    },
  ];

  const excusedSelected = value === "excused";

  return (
    <li className="flex flex-col gap-3 border-b border-[var(--color-border)] py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 text-base font-medium text-[var(--color-foreground)]">{label}</div>
      <div className="flex w-full max-w-xl flex-wrap gap-2">
        {opts.map((o) => {
          const pressed = !excusedSelected && value === o.code;
          return (
            <button
              key={o.code}
              type="button"
              data-pressed={pressed}
              aria-pressed={pressed}
              aria-label={o.label}
              title={o.label}
              className={`min-h-[52px] min-w-[52px] flex-1 rounded-[var(--layout-border-radius)] border-2 text-lg font-bold transition ${o.className} ${
                pressed ? "" : "bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              }`}
              onClick={() => onChange(o.code)}
            >
              {o.letter}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={excusedSelected}
          aria-label={dict.excusedLabel}
          title={dict.excusedLabel}
          disabled={excusedSelected}
          className={`min-h-[52px] min-w-[52px] flex-1 rounded-[var(--layout-border-radius)] border-2 text-lg font-bold transition ${
            excusedSelected
              ? "border-[var(--color-muted-foreground)] bg-[var(--color-muted)] text-[var(--color-foreground)]"
              : "cursor-not-allowed border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 text-[var(--color-muted-foreground)]"
          }`}
        >
          {dict.excusedLetter}
        </button>
      </div>
    </li>
  );
}
