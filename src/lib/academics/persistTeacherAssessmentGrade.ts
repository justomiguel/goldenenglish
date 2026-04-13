import type { SupabaseClient } from "@supabase/supabase-js";
import type { RubricDimensionDef } from "@/types/rubricDimensions";
import { validateRubricAgainstDimensions } from "@/lib/academics/cohortRubricDimensions";

export type TeacherAssessmentGradePayload = {
  locale: string;
  sectionId: string;
  assessmentId: string;
  enrollmentId: string;
  score: number;
  rubric: Record<string, number>;
  teacherFeedback: string | null;
};

export type PersistTeacherGradeCode = "ok" | "validation" | "forbidden" | "save" | "score_cap";

export async function persistTeacherAssessmentGrade(
  supabase: SupabaseClient,
  teacherProfileId: string,
  cohortId: string,
  payload: TeacherAssessmentGradePayload,
  status: "draft" | "published",
  dimensions: RubricDimensionDef[],
): Promise<PersistTeacherGradeCode> {
  if (!validateRubricAgainstDimensions(payload.rubric, dimensions)) return "validation";

  const { data: asmt } = await supabase
    .from("cohort_assessments")
    .select("cohort_id, max_score")
    .eq("id", payload.assessmentId)
    .maybeSingle();
  if (!asmt || (asmt as { cohort_id: string }).cohort_id !== cohortId) return "forbidden";

  const maxScore = Number((asmt as { max_score: number }).max_score);
  if (!Number.isFinite(maxScore)) return "forbidden";
  if (payload.score > maxScore + 1e-6) return "score_cap";

  const { data: enr } = await supabase
    .from("section_enrollments")
    .select("id")
    .eq("id", payload.enrollmentId)
    .eq("section_id", payload.sectionId)
    .maybeSingle();
  if (!enr) return "forbidden";

  const row = {
    enrollment_id: payload.enrollmentId,
    assessment_id: payload.assessmentId,
    score: payload.score,
    rubric_data: payload.rubric,
    teacher_feedback: payload.teacherFeedback?.trim() ? payload.teacherFeedback.trim() : null,
    status,
    updated_by: teacherProfileId,
  };

  const { error } = await supabase.from("enrollment_assessment_grades").upsert(row, {
    onConflict: "enrollment_id,assessment_id",
  });
  if (error) return "save";
  return "ok";
}
