"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";

export interface AdminRegistrationSectionChoicesProps {
  id: string;
  sections: CurrentCohortSection[];
  sectionId: string;
  onSectionId: (id: string) => void;
  busy: boolean;
  assignLabel: string;
  createHref?: string | null;
  createLabel?: string;
  onAssign: () => void;
}

export function AdminRegistrationSectionChoices({
  id,
  sections,
  sectionId,
  onSectionId,
  busy,
  assignLabel,
  createHref,
  createLabel,
  onAssign,
}: AdminRegistrationSectionChoicesProps) {
  if (sections.length === 0 && createHref && createLabel) {
    return (
      <Link
        href={createHref}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
      >
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        {createLabel}
      </Link>
    );
  }

  const open = sections.filter((section) => section.activeCount < section.maxStudents);
  return (
    <>
      <Label htmlFor={id}>{assignLabel}</Label>
      <select
        id={id}
        className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
        value={sectionId}
        onChange={(event) => onSectionId(event.target.value)}
        disabled={busy}
      >
        <option value="">—</option>
        {open.map((section) => (
          <option key={section.id} value={section.id}>
            {section.name}
          </option>
        ))}
      </select>
      <Button type="button" size="sm" disabled={busy || !sectionId} onClick={onAssign}>
        {assignLabel}
      </Button>
    </>
  );
}
