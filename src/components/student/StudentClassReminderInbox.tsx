"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { markClassReminderInAppReadAction } from "@/app/[locale]/dashboard/student/classReminderInAppActions";

export type ClassReminderInboxRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

type Labels = Pick<
  Dictionary["dashboard"]["student"],
  "classReminderUpcomingTitle" | "classReminderUpcomingEmpty" | "classReminderMarkRead"
>;

export interface StudentClassReminderInboxProps {
  locale: string;
  rows: ClassReminderInboxRow[];
  labels: Labels;
}

export function StudentClassReminderInbox({ locale, rows, labels }: StudentClassReminderInboxProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!rows.length) {
    return (
      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--color-secondary)]">{labels.classReminderUpcomingTitle}</h2>
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">{labels.classReminderUpcomingEmpty}</p>
      </div>
    );
  }

  async function markRead(id: string) {
    setBusyId(id);
    await markClassReminderInAppReadAction(locale, id);
    setBusyId(null);
  }

  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-sm font-semibold text-[var(--color-secondary)]">{labels.classReminderUpcomingTitle}</h2>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-lg border border-[var(--color-border)] p-3">
            <p className="text-sm font-medium text-[var(--color-foreground)]">{r.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-[var(--color-muted-foreground)]">{r.body}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 min-h-[40px]"
              disabled={busyId === r.id}
              onClick={() => void markRead(r.id)}
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              {labels.classReminderMarkRead}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
