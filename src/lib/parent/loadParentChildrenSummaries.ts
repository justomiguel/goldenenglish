import type { SupabaseClient } from "@supabase/supabase-js";
import { loadChildrenSummariesForStudentIds } from "@/lib/parent/loadChildrenSummariesForStudentIds";

export type ParentChildLastGrade = {
  score: number;
  maxScore: number;
  assessmentName: string;
  assessmentOn: string;
};

export type ParentChildSummary = {
  studentId: string;
  firstName: string;
  lastName: string;
  attendancePercent: number | null;
  levelLabel: string | null;
  nextExamAt: string | null;
  nextEventAt: string | null;
  nextEventLabel: string | null;
  assignedTeacherId: string | null;
  assignedTeacherName: string | null;
  lastPublishedGrade: ParentChildLastGrade | null;
};

export async function loadParentChildrenSummaries(
  supabase: SupabaseClient,
  tutorId: string,
): Promise<ParentChildSummary[]> {
  const { data: links } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", tutorId);

  const ids = (links ?? []).map((l) => l.student_id as string);
  return loadChildrenSummariesForStudentIds(supabase, ids);
}
