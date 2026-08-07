"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import type { ParentFocusCatalog, ResolvedParentFocus } from "@/lib/parent/parentFocusTypes";
import { withParentFocusHref } from "@/lib/parent/withParentFocusHref";

export interface ParentFocusSwitcherDesktopProps {
  catalog: ParentFocusCatalog;
  focus: ResolvedParentFocus;
  labels: Dictionary["dashboard"]["parent"]["focus"];
}

function chipClass(active: boolean): string {
  return active
    ? "block w-full rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-left text-xs font-semibold text-[var(--color-primary-foreground)]"
    : "block w-full rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-left text-xs font-medium text-[var(--color-foreground)]/85 hover:bg-[var(--color-muted)]";
}

export function ParentFocusSwitcherDesktop({
  catalog,
  focus,
  labels,
}: ParentFocusSwitcherDesktopProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  function hrefFor(studentId: string, sectionId: string | null): string {
    const base = tab ? `${pathname}?tab=${encodeURIComponent(tab)}` : pathname;
    return withParentFocusHref(base, { studentId, sectionId });
  }

  const sections = focus.sectionsForStudent;
  const showStudentChips = catalog.students.length > 1;
  const showSectionChips = sections.length > 1;

  return (
    <div className="mb-4 space-y-3 border-b border-[var(--color-border)] px-2 pb-4" aria-label={labels.focusBarAria}>
      <div>
        <p className="mb-1.5 px-1 text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          {labels.childLabel}
        </p>
        {showStudentChips ? (
          <div className="flex flex-col gap-1.5">
            {catalog.students.map((student) => {
              const firstSection =
                catalog.sectionsByStudentId[student.studentId]?.[0]?.sectionId ?? null;
              const sectionId =
                student.studentId === focus.studentId
                  ? focus.sectionId
                  : firstSection;
              return (
                <Link
                  key={student.studentId}
                  href={hrefFor(student.studentId, sectionId)}
                  className={chipClass(student.studentId === focus.studentId)}
                >
                  {student.displayName}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="px-1 text-sm font-semibold text-[var(--color-foreground)]">
            {focus.student?.displayName ?? "—"}
          </p>
        )}
      </div>

      <div>
        <p className="mb-1.5 px-1 text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          {labels.sectionLabel}
        </p>
        {sections.length === 0 ? (
          <p className="px-1 text-sm text-[var(--color-muted-foreground)]">{labels.noActiveSection}</p>
        ) : showSectionChips && focus.studentId ? (
          <div className="flex flex-col gap-1.5">
            {sections.map((section) => (
              <Link
                key={section.sectionId}
                href={hrefFor(focus.studentId!, section.sectionId)}
                className={chipClass(section.sectionId === focus.sectionId)}
              >
                {section.classLabel}
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-1 text-sm font-semibold text-[var(--color-foreground)]">
            {focus.section?.classLabel ?? labels.noActiveSection}
          </p>
        )}
      </div>
    </div>
  );
}
