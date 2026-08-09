import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudentExamResult } from "@/types/studentExams";
import {
  buildStudentExamResults,
  type ExamAssessmentInput,
  type ExamPublishedGrade,
} from "@/lib/parent/buildStudentExamResults";
import { noteReadFailure, type LoadErrorReporter } from "@/lib/logging/noteReadFailure";

const SCOPE = "loadStudentExamResults";

const MAX_ENROLLMENTS = 20;
const MAX_SECTIONS = 20;
const MAX_ASSESSMENTS = 100;
const MAX_GRADES = 100;

export interface LoadStudentExamResultsParams {
  studentId: string;
  now?: Date;
  /** Told when a read came back short, so the screen can say so instead of showing an empty list. */
  onLoadError?: LoadErrorReporter;
}

function toNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Every exam of the cohorts a student belongs to, with the student's published grade when there is
 * one.
 *
 * Exams are read per cohort rather than per grade so an evaluación that a teacher created but has not
 * graded still reaches the family. Only `status = 'published'` grades are read: RLS lets guardians
 * select drafts, so the publish gate has to live here.
 */
export async function loadStudentExamResults(
  supabase: SupabaseClient,
  { studentId, now = new Date(), onLoadError }: LoadStudentExamResultsParams,
): Promise<StudentExamResult[]> {
  if (!studentId) return [];

  const { data: enrollmentRows, error: enrollmentsError } = await supabase
    .from("section_enrollments")
    .select("id, section_id")
    .eq("student_id", studentId)
    .eq("status", "active")
    .limit(MAX_ENROLLMENTS);
  noteReadFailure(`${SCOPE}:enrollments`, enrollmentsError, { studentId }, onLoadError);

  const enrollments = (enrollmentRows ?? []) as { id: string; section_id: string | null }[];
  const enrollmentIds = enrollments.map((row) => row.id);
  const sectionIds = [...new Set(enrollments.map((row) => row.section_id).filter(Boolean) as string[])];
  if (sectionIds.length === 0) return [];

  const { data: sectionRows, error: sectionsError } = await supabase
    .from("academic_sections")
    .select("id, name, cohort_id")
    .in("id", sectionIds)
    .limit(MAX_SECTIONS);
  noteReadFailure(`${SCOPE}:sections`, sectionsError, { studentId }, onLoadError);

  const sectionNameByCohortId = new Map<string, string>();
  for (const section of (sectionRows ?? []) as {
    id: string;
    name: string | null;
    cohort_id: string | null;
  }[]) {
    if (!section.cohort_id) continue;
    if (!sectionNameByCohortId.has(section.cohort_id)) {
      sectionNameByCohortId.set(section.cohort_id, section.name ?? "");
    }
  }

  const cohortIds = [...sectionNameByCohortId.keys()];
  if (cohortIds.length === 0) return [];

  const { data: assessmentRows, error: assessmentsError } = await supabase
    .from("cohort_assessments")
    .select("id, cohort_id, name, assessment_on, max_score")
    .in("cohort_id", cohortIds)
    .order("assessment_on", { ascending: false })
    .limit(MAX_ASSESSMENTS);
  noteReadFailure(`${SCOPE}:assessments`, assessmentsError, { studentId }, onLoadError);

  const assessments: ExamAssessmentInput[] = (
    (assessmentRows ?? []) as {
      id: string;
      cohort_id: string;
      name: string | null;
      assessment_on: string;
      max_score: number | string | null;
    }[]
  ).map((row) => ({
    id: row.id,
    cohortId: row.cohort_id,
    name: row.name ?? "",
    examOn: String(row.assessment_on).slice(0, 10),
    maxScore: toNumber(row.max_score),
  }));

  const gradesByAssessmentId = new Map<string, ExamPublishedGrade>();
  if (assessments.length && enrollmentIds.length) {
    const { data: gradeRows, error: gradesError } = await supabase
      .from("enrollment_assessment_grades")
      .select("assessment_id, score, teacher_feedback")
      .eq("status", "published")
      .in("enrollment_id", enrollmentIds)
      .limit(MAX_GRADES);
    noteReadFailure(`${SCOPE}:grades`, gradesError, { studentId }, onLoadError);

    for (const row of (gradeRows ?? []) as {
      assessment_id: string;
      score: number | string | null;
      teacher_feedback: string | null;
    }[]) {
      gradesByAssessmentId.set(row.assessment_id, {
        score: toNumber(row.score),
        hasTeacherFeedback: Boolean(row.teacher_feedback?.trim()),
      });
    }
  }

  return buildStudentExamResults({
    assessments,
    gradesByAssessmentId,
    sectionNameByCohortId,
    now,
  });
}
