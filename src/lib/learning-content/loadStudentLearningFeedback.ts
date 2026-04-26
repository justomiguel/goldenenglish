import type { SupabaseClient } from "@supabase/supabase-js";
import type { LearningFeedbackRow } from "@/types/learningContent";

type AttemptRow = {
  id: string;
  score: number | null;
  passed: boolean | null;
  diagnostic_label: string | null;
  teacher_feedback: string;
  learning_assessments:
    | { title: string; grading_mode: LearningFeedbackRow["gradingMode"]; section_id: string | null }
    | { title: string; grading_mode: LearningFeedbackRow["gradingMode"]; section_id: string | null }[]
    | null;
};

function first<T>(raw: T | T[] | null): T | null {
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export async function loadStudentLearningFeedback(
  supabase: SupabaseClient,
  studentId: string,
  limit = 8,
): Promise<LearningFeedbackRow[]> {
  const [{ data: attempts }, { data: readiness }] = await Promise.all([
    supabase
      .from("student_assessment_attempts")
      .select("id, score, passed, diagnostic_label, teacher_feedback, learning_assessments(title, grading_mode, section_id)")
      .eq("student_id", studentId)
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("student_learning_readiness")
      .select("section_id, readiness_status")
      .eq("student_id", studentId)
      .limit(40),
  ]);

  const readinessBySection = new Map(
    ((readiness ?? []) as { section_id: string; readiness_status: LearningFeedbackRow["readinessStatus"] }[]).map((row) => [
      row.section_id,
      row.readiness_status,
    ]),
  );

  return ((attempts ?? []) as AttemptRow[]).flatMap((row) => {
    const assessment = first(row.learning_assessments);
    if (!assessment) return [];
    return [{
      id: row.id,
      title: assessment.title,
      gradingMode: assessment.grading_mode,
      score: row.score,
      passed: row.passed,
      diagnosticLabel: row.diagnostic_label,
      teacherFeedback: row.teacher_feedback,
      readinessStatus: assessment.section_id ? readinessBySection.get(assessment.section_id) ?? null : null,
    }];
  });
}
