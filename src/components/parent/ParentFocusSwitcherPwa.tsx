"use client";

import { type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";
import type { ParentFocusCatalog, ResolvedParentFocus } from "@/lib/parent/parentFocusTypes";
import { withParentFocusHref } from "@/lib/parent/withParentFocusHref";

export interface ParentFocusSwitcherPwaProps {
  catalog: ParentFocusCatalog;
  focus: ResolvedParentFocus;
  labels: Dictionary["dashboard"]["parent"]["focus"];
  variant: "home" | "sticky";
}

const selectClass =
  "mt-1 block min-h-[44px] w-full appearance-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)]";

export function ParentFocusSwitcherPwa({
  catalog,
  focus,
  labels,
  variant,
}: ParentFocusSwitcherPwaProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sections = focus.sectionsForStudent;
  const compact = variant === "sticky";

  function pushFocus(studentId: string, sectionId: string | null) {
    const tab = searchParams.get("tab");
    const base = tab ? `${pathname}?tab=${encodeURIComponent(tab)}` : pathname;
    router.push(withParentFocusHref(base, { studentId, sectionId }));
  }

  function onStudentChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextStudentId = event.target.value;
    const firstSection =
      catalog.sectionsByStudentId[nextStudentId]?.[0]?.sectionId ?? null;
    pushFocus(nextStudentId, firstSection);
  }

  function onSectionChange(event: ChangeEvent<HTMLSelectElement>) {
    if (!focus.studentId) return;
    pushFocus(focus.studentId, event.target.value || null);
  }

  const shellClass = compact
    ? "sticky top-[var(--parent-pwa-header-offset,3.5rem)] z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-2 backdrop-blur-md"
    : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm";

  return (
    <div className={shellClass} aria-label={labels.focusBarAria}>
      <div className={compact ? "grid gap-2 sm:grid-cols-2" : "space-y-3"}>
        <div>
          {catalog.students.length > 1 ? (
            <>
              <Label htmlFor={`parent-focus-student-${variant}`}>{labels.childLabel}</Label>
              <select
                id={`parent-focus-student-${variant}`}
                value={focus.studentId ?? ""}
                onChange={onStudentChange}
                className={selectClass}
                aria-label={labels.childSelectAria}
              >
                {catalog.students.map((student) => (
                  <option key={student.studentId} value={student.studentId}>
                    {student.displayName}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                {labels.childLabel}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--color-foreground)]">
                {focus.student?.displayName ?? "—"}
              </p>
            </>
          )}
        </div>

        <div>
          {sections.length > 1 && focus.studentId ? (
            <>
              <Label htmlFor={`parent-focus-section-${variant}`}>{labels.sectionLabel}</Label>
              <select
                id={`parent-focus-section-${variant}`}
                value={focus.sectionId ?? ""}
                onChange={onSectionChange}
                className={selectClass}
                aria-label={labels.sectionSelectAria}
              >
                {sections.map((section) => (
                  <option key={section.sectionId} value={section.sectionId}>
                    {section.classLabel}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                {labels.sectionLabel}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--color-foreground)]">
                {sections.length === 0
                  ? labels.noActiveSection
                  : (focus.section?.classLabel ?? labels.noActiveSection)}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
