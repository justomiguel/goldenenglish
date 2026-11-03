"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { returnTaskAction } from "@/app/[locale]/dashboard/teacher/tasks/reviewActions";
import type { SectionTaskReturnRow } from "@/lib/learning-tasks/loadSectionTaskReturns";

interface TeacherTaskReturnsProps {
  locale: string;
  sectionId: string;
  rows: SectionTaskReturnRow[];
  labels: {
    taskReturnTitle: string;
    taskReturnNote: string;
    taskReturnButton: string;
    taskReturnFailed: string;
  };
}

export function TeacherTaskReturns({ locale, sectionId, rows, labels }: TeacherTaskReturnsProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [failedId, setFailedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const open = rows.filter((row) => row.status === "COMPLETED" || row.status === "COMPLETED_LATE");
  if (open.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.taskReturnTitle}</h2>
      <ul className="space-y-3">
        {open.map((row) => (
          <li key={row.progressId} className="space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-3">
            <p className="text-sm font-semibold text-[var(--color-foreground)]">{row.studentLabel}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">{row.taskTitle}</p>
            {row.answer ? <p className="text-sm text-[var(--color-foreground)]">{row.answer}</p> : null}
            <textarea
              value={notes[row.progressId] ?? ""}
              maxLength={4000}
              aria-label={labels.taskReturnNote}
              placeholder={labels.taskReturnNote}
              onChange={(event) => setNotes((current) => ({ ...current, [row.progressId]: event.target.value }))}
              className="min-h-20 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={pending || (notes[row.progressId] ?? "").trim().length === 0}
              onClick={() => {
                startTransition(async () => {
                  const result = await returnTaskAction({
                    locale,
                    sectionId,
                    progressId: row.progressId,
                    note: notes[row.progressId] ?? "",
                  });
                  if (!result.ok) {
                    setFailedId(row.progressId);
                    return;
                  }
                  setFailedId(null);
                  router.refresh();
                });
              }}
            >
              <Undo2 className="h-4 w-4" aria-hidden />
              {labels.taskReturnButton}
            </Button>
            {failedId === row.progressId ? (
              <p className="text-sm text-[var(--color-error)]" role="alert">{labels.taskReturnFailed}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
