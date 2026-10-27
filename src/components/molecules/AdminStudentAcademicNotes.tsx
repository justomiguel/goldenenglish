import type { Dictionary } from "@/types/i18n";
import type { AdminStudentAcademicNote } from "@/lib/dashboard/adminStudentAcademicNotes";
import { formatParentFeedbackDate } from "@/lib/parent/formatParentFeedbackLabels";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminStudentAcademicNotesProps {
  locale: string;
  notes: AdminStudentAcademicNote[];
  labels: UserLabels;
}

function scoreLabel(note: AdminStudentAcademicNote, labels: UserLabels): string | null {
  if (note.score == null) return null;
  if (note.maxScore == null) {
    return labels.detailAcademicNotesScoreOnly.replace("{score}", String(note.score));
  }
  return labels.detailAcademicNotesScore
    .replace("{score}", String(note.score))
    .replace("{max}", String(note.maxScore));
}

function metaLine(note: AdminStudentAcademicNote, locale: string, labels: UserLabels): string {
  const teacher = note.teacherName?.trim()
    ? labels.detailAcademicNotesTeacher.replace("{teacher}", note.teacherName.trim())
    : "";
  return [note.sectionName.trim(), teacher, formatParentFeedbackDate(note.occurredOn, locale)]
    .filter(Boolean)
    .join(" · ");
}

export function AdminStudentAcademicNotes({
  locale,
  notes,
  labels,
}: AdminStudentAcademicNotesProps) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)]">
      <h2 className="border-b border-[var(--color-border)] pb-3 font-display text-lg font-semibold text-[var(--color-primary)]">
        {labels.detailAcademicNotesTitle}
      </h2>
      {notes.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
          {labels.detailAcademicNotesEmpty}
        </p>
      ) : (
        <ol aria-label={labels.detailAcademicNotesListAria} className="mt-4 space-y-4">
          {notes.map((note) => {
            const score = scoreLabel(note, labels);
            const feedback = note.feedback.trim();
            return (
              <li key={note.id} className="space-y-1 border-b border-[var(--color-border)] pb-4 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">{note.title}</p>
                  {score ? (
                    <p className="text-sm font-semibold text-[var(--color-primary)]">{score}</p>
                  ) : null}
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {metaLine(note, locale, labels)}
                </p>
                {feedback ? (
                  <p className="line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap text-[var(--color-foreground)]">
                    {feedback}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
