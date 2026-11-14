import type { ReactNode } from "react";
import Link from "next/link";
import { SectionCapacityBar } from "@/components/molecules/SectionCapacityBar";
import { SectionReferenceThumb } from "@/components/molecules/SectionReferenceThumb";

export interface AcademicCohortSectionListRow {
  id: string;
  href: string;
  name: string;
  teacherNames: readonly string[];
  scheduleLine: string;
  activeCount: number;
  maxStudents: number;
  archivedLabel?: string;
  periodLine?: string;
  imageUrl?: string | null;
  actions?: ReactNode;
}

export interface AcademicCohortSectionListProps {
  locale: string;
  capacityLabel: string;
  labels: {
    section: string;
    teachers: string;
    schedule: string;
    emptyTeachers: string;
    emptySchedule: string;
    actions: string;
  };
  rows: readonly AcademicCohortSectionListRow[];
}

export function AcademicCohortSectionList({
  locale,
  capacityLabel,
  labels,
  rows,
}: AcademicCohortSectionListProps) {
  const listFormat = new Intl.ListFormat(locale, { type: "conjunction", style: "long" });
  const edge = "border-b border-r border-[var(--color-border)] first:border-l";
  const cell = `${edge} px-3 py-3 align-top`;
  const head = `${edge} border-t bg-[var(--color-muted)] px-3 py-2 font-medium text-[var(--color-foreground)]`;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] border-separate border-spacing-0 bg-[var(--color-surface)] text-left text-sm">
        <thead>
          <tr>
            <th scope="col" className={head}>{labels.section}</th>
            <th scope="col" className={head}>{labels.teachers}</th>
            <th scope="col" className={head}>{labels.schedule}</th>
            <th scope="col" className={head}>{capacityLabel}</th>
            <th scope="col" className={head}>
              <span className="sr-only">{labels.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-[var(--color-muted)]">
              <td className={cell}>
                <div className="flex min-w-0 items-center gap-2">
                  <SectionReferenceThumb src={row.imageUrl} alt="" size="sm" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={row.href}
                        className="font-semibold text-[var(--color-primary)] hover:underline"
                      >
                        {row.name}
                      </Link>
                      {row.archivedLabel ? (
                        <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]">
                          {row.archivedLabel}
                        </span>
                      ) : null}
                    </div>
                    {row.periodLine ? (
                      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{row.periodLine}</p>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className={`${cell} text-[var(--color-foreground)]`}>
                {row.teacherNames.length > 0
                  ? listFormat.format([...row.teacherNames])
                  : labels.emptyTeachers}
              </td>
              <td className={`${cell} text-[var(--color-foreground)]`}>
                {row.scheduleLine || labels.emptySchedule}
              </td>
              <td className={`${cell} min-w-36`}>
                <SectionCapacityBar
                  activeCount={row.activeCount}
                  maxStudents={row.maxStudents}
                  label={capacityLabel}
                />
              </td>
              <td className={cell}>{row.actions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
