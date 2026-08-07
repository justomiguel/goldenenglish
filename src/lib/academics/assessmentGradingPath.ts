export type AssessmentPathStep = 1 | 2 | 3 | 4;

export function resolveAssessmentPathStep(input: {
  hasAssessment: boolean;
  studentOpen: boolean;
  justPublished: boolean;
}): AssessmentPathStep {
  if (!input.hasAssessment) return 1;
  if (input.justPublished && input.studentOpen) return 4;
  if (input.studentOpen) return 3;
  return 2;
}

export function isPendingGradeStatus(status: "draft" | "published" | null | undefined): boolean {
  return status == null || status === "draft";
}

export function nextPendingEnrollmentId(
  rows: { enrollmentId: string; gradeStatus: "draft" | "published" | null }[],
  afterEnrollmentId: string,
): string | null {
  const start = rows.findIndex((r) => r.enrollmentId === afterEnrollmentId);
  if (start < 0) return null;
  for (let i = start + 1; i < rows.length; i++) {
    if (isPendingGradeStatus(rows[i].gradeStatus)) return rows[i].enrollmentId;
  }
  return null;
}

export function countAssessmentRosterStatuses(
  rows: { gradeStatus: "draft" | "published" | null }[],
): { published: number; draft: number; pending: number } {
  let published = 0;
  let draft = 0;
  let pending = 0;
  for (const row of rows) {
    if (row.gradeStatus === "published") published += 1;
    else if (row.gradeStatus === "draft") draft += 1;
    else pending += 1;
  }
  return { published, draft, pending };
}
