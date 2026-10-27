import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import {
  collectFeedbackTeacherIds,
  mapCohortGradeFeedbackRows,
  mapLearningAttemptFeedbackRows,
  type CohortGradeFeedbackRow,
  type FeedbackSectionMeta,
  type LearningAttemptFeedbackRow,
} from "@/lib/parent/mapParentFeedbackRows";
import {
  pickLatestAcademicNotes,
  type AdminStudentAcademicNote,
} from "@/lib/dashboard/adminStudentAcademicNotes";

const SCOPE = "loadAdminStudentAcademicNotes";
const ENROLLMENT_CAP = 30;
const ROW_CAP = 20;

async function loadSectionContext(supabase: SupabaseClient, studentId: string) {
  const { data, error } = await supabase
    .from("section_enrollments")
    .select("id, section_id")
    .eq("student_id", studentId)
    .limit(ENROLLMENT_CAP);
  if (error) {
    logSupabaseClientError(`${SCOPE}:enrollments`, error, { studentId });
  }

  const rows = (data ?? []) as { id: string; section_id: string | null }[];
  const sectionIds = [...new Set(rows.map((row) => row.section_id).filter(Boolean) as string[])];
  const sectionById = new Map<string, FeedbackSectionMeta>();
  if (sectionIds.length > 0) {
    const { data: sections, error: sectionsError } = await supabase
      .from("academic_sections")
      .select("id, name, teacher_id")
      .in("id", sectionIds);
    if (sectionsError) {
      logSupabaseClientError(`${SCOPE}:sections`, sectionsError, { studentId });
    }
    for (const section of (sections ?? []) as {
      id: string;
      name: string | null;
      teacher_id: string | null;
    }[]) {
      sectionById.set(section.id, {
        name: section.name ?? "",
        teacherId: section.teacher_id,
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
  if (teacherIds.length === 0) return names;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", teacherIds);
  if (error) {
    logSupabaseClientError(`${SCOPE}:teachers`, error);
    return names;
  }
  for (const profile of (data ?? []) as {
    id: string;
    first_name: string | null;
    last_name: string | null;
  }[]) {
    names.set(profile.id, formatProfileNameSurnameFirst(profile.first_name, profile.last_name));
  }
  return names;
}

/** Latest published grades and teacher comments for the admin academic tab. */
export async function loadAdminStudentAcademicNotes(
  supabase: SupabaseClient,
  studentId: string,
): Promise<AdminStudentAcademicNote[]> {
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
          .in("enrollment_id", enrollmentIds)
          .order("updated_at", { ascending: false })
          .limit(ROW_CAP)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("student_assessment_attempts")
      .select(
        "id, score, teacher_feedback, reviewed_at, updated_at, reviewed_by, learning_assessments(title, section_id)",
      )
      .eq("student_id", studentId)
      .order("updated_at", { ascending: false })
      .limit(ROW_CAP),
  ]);

  if (gradeResult.error) {
    logSupabaseClientError(`${SCOPE}:grades`, gradeResult.error, { studentId });
  }
  if (attemptResult.error) {
    logSupabaseClientError(`${SCOPE}:attempts`, attemptResult.error, { studentId });
  }

  const gradeRows = (gradeResult.error ? [] : (gradeResult.data ?? [])) as CohortGradeFeedbackRow[];
  const attemptRows = (attemptResult.error ? [] : (attemptResult.data ?? [])) as LearningAttemptFeedbackRow[];
  const teacherNameById = await loadTeacherNames(
    supabase,
    collectFeedbackTeacherIds({ gradeRows, attemptRows, sectionByEnrollmentId, sectionById }),
  );
  const context = {
    studentId,
    childLabel: "",
    sectionByEnrollmentId,
    sectionById,
    teacherNameById,
  };

  const drafts = [
    ...mapCohortGradeFeedbackRows(gradeRows, context),
    ...mapLearningAttemptFeedbackRows(attemptRows, context),
  ];

  return pickLatestAcademicNotes(
    drafts.map((draft) => ({
      id: draft.id,
      title: draft.title,
      sectionName: draft.contextLabel,
      teacherName: draft.teacherName,
      occurredOn: draft.occurredOn,
      score: draft.score,
      maxScore: draft.maxScore,
      feedback: draft.feedback,
    })),
  );
}
