import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeacherAssessmentAttemptReview } from "@/types/learningContent";

type AttemptRow = {
  id: string;
  student_id: string;
  score: number | null;
  passed: boolean | null;
  status: string;
  teacher_feedback: string;
  profiles: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
  learning_assessments: { title: string; section_id: string | null } | { title: string; section_id: string | null }[] | null;
};

function first<T>(raw: T | T[] | null): T | null {
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export async function loadTeacherAssessmentAttempts(
  supabase: SupabaseClient,
  sectionId: string,
  limit = 20,
): Promise<TeacherAssessmentAttemptReview[]> {
  const { data } = await supabase
    .from("student_assessment_attempts")
    .select("id, student_id, score, passed, status, teacher_feedback, profiles!student_assessment_attempts_student_id_fkey(first_name, last_name), learning_assessments(title, section_id)")
    .order("updated_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as AttemptRow[]).flatMap((attempt) => {
    const assessment = first(attempt.learning_assessments);
    if (!assessment || assessment.section_id !== sectionId) return [];
    const profile = first(attempt.profiles);
    const studentLabel = profile ? `${profile.first_name} ${profile.last_name}`.trim() : attempt.student_id;
    return [{
      id: attempt.id,
      studentId: attempt.student_id,
      studentLabel,
      assessmentTitle: assessment.title,
      score: attempt.score,
      passed: attempt.passed,
      status: attempt.status,
      teacherFeedback: attempt.teacher_feedback,
    }];
  });
}
