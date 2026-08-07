import type { ParentFeedbackDraft } from "@/lib/parent/buildParentFeedbackTimeline";

/** `student_assessment_attempts.score` is constrained to 0–100 by the schema. */
export const LEARNING_ATTEMPT_MAX_SCORE = 100;

type Embedded<T> = T | T[] | null;

export type CohortGradeFeedbackRow = {
  enrollment_id: string;
  assessment_id: string;
  score: number | string | null;
  teacher_feedback: string | null;
  updated_at: string | null;
  cohort_assessments: Embedded<{ name: string; max_score: number | string | null }>;
};

export type LearningAttemptFeedbackRow = {
  id: string;
  score: number | string | null;
  teacher_feedback: string | null;
  reviewed_at: string | null;
  updated_at: string | null;
  reviewed_by: string | null;
  learning_assessments: Embedded<{ title: string; section_id: string | null }>;
};

export type FeedbackSectionMeta = { name: string; teacherId: string | null };

export interface ParentFeedbackMappingContext {
  studentId: string;
  childLabel: string;
  /** Section metadata keyed by `section_enrollments.id`. */
  sectionByEnrollmentId: Map<string, FeedbackSectionMeta>;
  /** Section metadata keyed by `academic_sections.id`. */
  sectionById: Map<string, FeedbackSectionMeta>;
  teacherNameById: Map<string, string>;
}

/**
 * Identity of a cohort-grade comment in the timeline.
 *
 * The home screen builds the same key from its own grade query to tell whether this device has
 * already opened that comment, so both callers must go through here or the mark would lie.
 */
export function parentFeedbackGradeItemKey(enrollmentId: string, assessmentId: string): string {
  return `assessment:${enrollmentId}:${assessmentId}`;
}

function firstEmbedded<T>(raw: Embedded<T>): T | null {
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

function toFiniteNumber(raw: number | string | null): number | null {
  if (raw == null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Timestamps arrive as ISO strings; the timeline groups by calendar day. */
function toIsoDay(raw: string | null): string {
  return raw ? String(raw).slice(0, 10) : "";
}

export function mapCohortGradeFeedbackRows(
  rows: CohortGradeFeedbackRow[],
  context: ParentFeedbackMappingContext,
): ParentFeedbackDraft[] {
  return rows.flatMap((row) => {
    const assessment = firstEmbedded(row.cohort_assessments);
    if (!assessment) return [];
    const section = context.sectionByEnrollmentId.get(row.enrollment_id) ?? null;
    const teacherId = section?.teacherId ?? null;
    return [
      {
        id: parentFeedbackGradeItemKey(row.enrollment_id, row.assessment_id),
        source: "assessment" as const,
        studentId: context.studentId,
        childLabel: context.childLabel,
        title: String(assessment.name ?? ""),
        contextLabel: section?.name ?? "",
        teacherName: teacherId ? (context.teacherNameById.get(teacherId) ?? null) : null,
        occurredOn: toIsoDay(row.updated_at),
        score: toFiniteNumber(row.score),
        maxScore: toFiniteNumber(assessment.max_score ?? null),
        feedback: row.teacher_feedback ?? "",
      },
    ];
  });
}

export function mapLearningAttemptFeedbackRows(
  rows: LearningAttemptFeedbackRow[],
  context: ParentFeedbackMappingContext,
): ParentFeedbackDraft[] {
  return rows.flatMap((row) => {
    const assessment = firstEmbedded(row.learning_assessments);
    if (!assessment) return [];
    const section = assessment.section_id ? context.sectionById.get(assessment.section_id) : null;
    const teacherId = row.reviewed_by ?? section?.teacherId ?? null;
    const score = toFiniteNumber(row.score);
    return [
      {
        id: `learning:${row.id}`,
        source: "learning" as const,
        studentId: context.studentId,
        childLabel: context.childLabel,
        title: String(assessment.title ?? ""),
        contextLabel: section?.name ?? "",
        teacherName: teacherId ? (context.teacherNameById.get(teacherId) ?? null) : null,
        occurredOn: toIsoDay(row.reviewed_at ?? row.updated_at),
        score,
        maxScore: score == null ? null : LEARNING_ATTEMPT_MAX_SCORE,
        feedback: row.teacher_feedback ?? "",
      },
    ];
  });
}

/** Teacher profile ids referenced by either feedback stream, for a single names lookup. */
export function collectFeedbackTeacherIds(params: {
  gradeRows: CohortGradeFeedbackRow[];
  attemptRows: LearningAttemptFeedbackRow[];
  sectionByEnrollmentId: Map<string, FeedbackSectionMeta>;
  sectionById: Map<string, FeedbackSectionMeta>;
}): string[] {
  const ids = new Set<string>();
  for (const row of params.gradeRows) {
    const teacherId = params.sectionByEnrollmentId.get(row.enrollment_id)?.teacherId;
    if (teacherId) ids.add(teacherId);
  }
  for (const row of params.attemptRows) {
    if (row.reviewed_by) ids.add(row.reviewed_by);
    const assessment = firstEmbedded(row.learning_assessments);
    const teacherId = assessment?.section_id
      ? params.sectionById.get(assessment.section_id)?.teacherId
      : null;
    if (teacherId) ids.add(teacherId);
  }
  return [...ids];
}
