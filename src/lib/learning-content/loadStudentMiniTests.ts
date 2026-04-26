import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudentMiniTestAssessment } from "@/types/learningContent";

type EnrollmentRow = { section_id: string; academic_sections: { name: string } | { name: string }[] | null };
type AssessmentRow = {
  id: string;
  title: string;
  assessment_kind: string;
  grading_mode: StudentMiniTestAssessment["gradingMode"];
  section_id: string;
};
type LinkRow = { assessment_id: string; question_id: string; sort_order: number };
type QuestionRow = { id: string; prompt: string; question_type: string };

function first<T>(raw: T | T[] | null): T | null {
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export async function loadStudentMiniTests(
  supabase: SupabaseClient,
  studentId: string,
): Promise<StudentMiniTestAssessment[]> {
  const { data: enrollments } = await supabase
    .from("section_enrollments")
    .select("section_id, academic_sections(name)")
    .eq("student_id", studentId)
    .eq("status", "active")
    .limit(20);
  const enrollmentRows = (enrollments ?? []) as EnrollmentRow[];
  const sectionIds = [...new Set(enrollmentRows.map((row) => row.section_id))];
  if (sectionIds.length === 0) return [];

  const sectionNameById = new Map(
    enrollmentRows.map((row) => [row.section_id, first(row.academic_sections)?.name ?? ""]),
  );
  const { data: assessments } = await supabase
    .from("learning_assessments")
    .select("id, title, assessment_kind, grading_mode, section_id")
    .in("section_id", sectionIds)
    .in("assessment_kind", ["entry", "exit", "mini_test", "diagnostic"])
    .order("updated_at", { ascending: false })
    .limit(40);
  const assessmentRows = (assessments ?? []) as AssessmentRow[];
  if (assessmentRows.length === 0) return [];

  const assessmentIds = assessmentRows.map((assessment) => assessment.id);
  const [{ data: links }, { data: attempts }] = await Promise.all([
    supabase
      .from("learning_assessment_questions")
      .select("assessment_id, question_id, sort_order")
      .in("assessment_id", assessmentIds)
      .order("sort_order", { ascending: true })
      .limit(200),
    supabase
      .from("student_assessment_attempts")
      .select("assessment_id, status")
      .eq("student_id", studentId)
      .in("assessment_id", assessmentIds)
      .order("updated_at", { ascending: false })
      .limit(80),
  ]);
  const linkRows = (links ?? []) as LinkRow[];
  const questionIds = [...new Set(linkRows.map((row) => row.question_id))];
  if (questionIds.length === 0) return [];

  const { data: questions } = await supabase
    .from("question_bank_items")
    .select("id, prompt, question_type")
    .in("id", questionIds)
    .eq("question_type", "true_false")
    .limit(200);
  const questionById = new Map(((questions ?? []) as QuestionRow[]).map((row) => [row.id, row]));
  const latestAttemptByAssessment = new Map(
    ((attempts ?? []) as { assessment_id: string; status: string }[]).map((row) => [row.assessment_id, row.status]),
  );

  return assessmentRows.flatMap((assessment) => {
    const questionsForAssessment = linkRows
      .filter((link) => link.assessment_id === assessment.id)
      .map((link) => questionById.get(link.question_id))
      .filter((question): question is QuestionRow => Boolean(question));
    if (questionsForAssessment.length === 0) return [];
    return [{
      id: assessment.id,
      title: assessment.title,
      assessmentKind: assessment.assessment_kind,
      gradingMode: assessment.grading_mode,
      sectionName: sectionNameById.get(assessment.section_id) ?? "",
      latestAttemptStatus: latestAttemptByAssessment.get(assessment.id) ?? null,
      questions: questionsForAssessment.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        questionType: "true_false" as const,
      })),
    }];
  });
}
