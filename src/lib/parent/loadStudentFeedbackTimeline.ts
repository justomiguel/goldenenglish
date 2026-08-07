import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParentFeedbackTimeline } from "@/types/parentFeedback";
import {
  PARENT_FEEDBACK_DEFAULT_LIMIT,
  buildParentFeedbackTimeline,
} from "@/lib/parent/buildParentFeedbackTimeline";
import {
  collectFeedbackTeacherIds,
  mapCohortGradeFeedbackRows,
  mapLearningAttemptFeedbackRows,
  type CohortGradeFeedbackRow,
  type FeedbackSectionMeta,
  type LearningAttemptFeedbackRow,
} from "@/lib/parent/mapParentFeedbackRows";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const SCOPE = "loadStudentFeedbackTimeline";

const EMPTY_TIMELINE: ParentFeedbackTimeline = { items: [], newCount: 0 };

export interface LoadStudentFeedbackTimelineParams {
  studentId: string;
  /** Surname-first display name, shown when several wards share one timeline view. */
  childLabel: string;
  limit?: number;
  now?: Date;
}

async function loadSectionContext(supabase: SupabaseClient, studentId: string) {
  const { data: enrollments, error } = await supabase
    .from("section_enrollments")
    .select("id, section_id")
    .eq("student_id", studentId);
  logSupabaseClientError(`${SCOPE}:enrollments`, error, { studentId });

  const rows = (enrollments ?? []) as { id: string; section_id: string | null }[];
  const sectionIds = [...new Set(rows.map((row) => row.section_id).filter(Boolean) as string[])];

  const sectionById = new Map<string, FeedbackSectionMeta>();
  if (sectionIds.length) {
    const { data: sections, error: sectionsError } = await supabase
      .from("academic_sections")
      .select("id, name, teacher_id")
      .in("id", sectionIds);
    logSupabaseClientError(`${SCOPE}:sections`, sectionsError, { studentId });
    for (const section of (sections ?? []) as {
      id: string;
      name: string | null;
      teacher_id: string | null;
    }[]) {
      sectionById.set(section.id, {
        name: section.name ?? "",
        teacherId: section.teacher_id ?? null,
      });
    }
  }

  const sectionByEnrollmentId = new Map<string, FeedbackSectionMeta>();
  for (const row of rows) {
    const meta = row.section_id ? sectionById.get(row.section_id) : undefined;
    if (meta) sectionByEnrollmentId.set(row.id, meta);
  }

  return {
    enrollmentIds: rows.map((row) => row.id),
    sectionById,
    sectionByEnrollmentId,
  };
}

async function loadTeacherNames(
  supabase: SupabaseClient,
  teacherIds: string[],
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (!teacherIds.length) return names;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", teacherIds);
  logSupabaseClientError(`${SCOPE}:teacherProfiles`, error);
  for (const profile of (data ?? []) as {
    id: string;
    first_name: string | null;
    last_name: string | null;
  }[]) {
    names.set(profile.id, formatProfileNameSurnameFirst(profile.first_name, profile.last_name));
  }
  return names;
}

/**
 * One family-facing timeline of the text teachers wrote, merging published cohort rubric
 * grades with reviewed learning-route attempts.
 *
 * Only `status = 'published'` grades are read: RLS lets guardians select drafts, so the
 * publish gate has to live here.
 */
export async function loadStudentFeedbackTimeline(
  supabase: SupabaseClient,
  { studentId, childLabel, limit = PARENT_FEEDBACK_DEFAULT_LIMIT, now = new Date() }:
    LoadStudentFeedbackTimelineParams,
): Promise<ParentFeedbackTimeline> {
  if (!studentId) return EMPTY_TIMELINE;

  const { enrollmentIds, sectionById, sectionByEnrollmentId } = await loadSectionContext(
    supabase,
    studentId,
  );

  const [gradeResult, attemptResult] = await Promise.all([
    enrollmentIds.length
      ? supabase
          .from("enrollment_assessment_grades")
          .select(
            "enrollment_id, assessment_id, score, teacher_feedback, updated_at, cohort_assessments(name, max_score)",
          )
          .eq("status", "published")
          .not("teacher_feedback", "is", null)
          .in("enrollment_id", enrollmentIds)
          .order("updated_at", { ascending: false })
          .limit(limit)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("student_assessment_attempts")
      .select(
        "id, score, teacher_feedback, reviewed_at, updated_at, reviewed_by, learning_assessments(title, section_id)",
      )
      .eq("student_id", studentId)
      .neq("teacher_feedback", "")
      .order("updated_at", { ascending: false })
      .limit(limit),
  ]);

  logSupabaseClientError(`${SCOPE}:grades`, gradeResult.error, { studentId });
  logSupabaseClientError(`${SCOPE}:attempts`, attemptResult.error, { studentId });

  const gradeRows = (gradeResult.data ?? []) as CohortGradeFeedbackRow[];
  const attemptRows = (attemptResult.data ?? []) as LearningAttemptFeedbackRow[];

  const teacherNameById = await loadTeacherNames(
    supabase,
    collectFeedbackTeacherIds({ gradeRows, attemptRows, sectionByEnrollmentId, sectionById }),
  );

  const context = {
    studentId,
    childLabel,
    sectionByEnrollmentId,
    sectionById,
    teacherNameById,
  };

  return buildParentFeedbackTimeline({
    entries: [
      ...mapCohortGradeFeedbackRows(gradeRows, context),
      ...mapLearningAttemptFeedbackRows(attemptRows, context),
    ],
    now,
    limit,
  });
}
