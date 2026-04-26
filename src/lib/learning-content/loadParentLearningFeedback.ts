import type { SupabaseClient } from "@supabase/supabase-js";
import type { LearningFeedbackRow } from "@/types/learningContent";

export type ParentLearningFeedbackRow = LearningFeedbackRow & {
  studentId: string;
  childLabel: string;
};

type AttemptRow = {
  id: string;
  student_id: string;
  score: number | null;
  passed: boolean | null;
  diagnostic_label: string | null;
  teacher_feedback: string;
  learning_assessments: { title: string; grading_mode: LearningFeedbackRow["gradingMode"] } | { title: string; grading_mode: LearningFeedbackRow["gradingMode"] }[] | null;
};

function first<T>(raw: T | T[] | null): T | null {
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export async function loadParentLearningFeedback(
  supabase: SupabaseClient,
  tutorId: string,
  limit = 12,
): Promise<ParentLearningFeedbackRow[]> {
  const { data: links } = await supabase.from("tutor_student_rel").select("student_id").eq("tutor_id", tutorId);
  const studentIds = [...new Set((links ?? []).map((row) => row.student_id as string))];
  if (studentIds.length === 0) return [];

  const [{ data: profiles }, { data: attempts }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name").in("id", studentIds),
    supabase
      .from("student_assessment_attempts")
      .select("id, student_id, score, passed, diagnostic_label, teacher_feedback, learning_assessments(title, grading_mode)")
      .in("student_id", studentIds)
      .order("updated_at", { ascending: false })
      .limit(limit),
  ]);
  const nameById = new Map(
    ((profiles ?? []) as { id: string; first_name: string; last_name: string }[]).map((profile) => [
      profile.id,
      `${profile.first_name} ${profile.last_name}`.trim(),
    ]),
  );

  return ((attempts ?? []) as AttemptRow[]).flatMap((attempt) => {
    const assessment = first(attempt.learning_assessments);
    if (!assessment) return [];
    return [{
      id: attempt.id,
      studentId: attempt.student_id,
      childLabel: nameById.get(attempt.student_id) ?? "",
      title: assessment.title,
      gradingMode: assessment.grading_mode,
      score: attempt.score,
      passed: attempt.passed,
      diagnosticLabel: attempt.diagnostic_label,
      teacherFeedback: attempt.teacher_feedback,
      readinessStatus: null,
    }];
  });
}
