/** Latest published grade or teacher comment shown on the admin student academic tab. */
export type AdminStudentAcademicNote = {
  id: string;
  title: string;
  sectionName: string;
  teacherName: string | null;
  /** ISO day `YYYY-MM-DD`. */
  occurredOn: string;
  score: number | null;
  maxScore: number | null;
  feedback: string;
};

export const ADMIN_ACADEMIC_NOTE_LIMIT = 5;

function hasAcademicContent(note: AdminStudentAcademicNote): boolean {
  return note.feedback.trim().length > 0 || note.score != null;
}

/** Newest dated notes that have a score or a comment, capped for the profile tab. */
export function pickLatestAcademicNotes(
  notes: AdminStudentAcademicNote[],
  limit = ADMIN_ACADEMIC_NOTE_LIMIT,
): AdminStudentAcademicNote[] {
  return notes
    .filter((note) => note.occurredOn.length >= 10 && hasAcademicContent(note))
    .toSorted((left, right) => (left.occurredOn < right.occurredOn ? 1 : left.occurredOn > right.occurredOn ? -1 : 0))
    .slice(0, Math.max(0, limit));
}
