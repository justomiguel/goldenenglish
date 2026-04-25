import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskProgressStatus } from "@/lib/learning-tasks/types";
import type { ParentLearningTaskRow } from "@/types/learningTasks";

type LinkedProfile = { id: string; first_name: string; last_name: string };
type EnrollmentRow = { id: string; student_id: string; section_id: string };
type ProgressRow = {
  status: TaskProgressStatus;
  student_id: string;
  task_instances:
    | {
        id: string;
        title: string;
        due_at: string;
        academic_sections: { name: string } | { name: string }[] | null;
      }
    | {
        id: string;
        title: string;
        due_at: string;
        academic_sections: { name: string } | { name: string }[] | null;
      }[]
    | null;
};

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function loadParentLearningTasks(
  supabase: SupabaseClient,
  tutorId: string,
  limit = 40,
): Promise<ParentLearningTaskRow[]> {
  const { data: links } = await supabase.from("tutor_student_rel").select("student_id").eq("tutor_id", tutorId);
  const studentIds = [...new Set((links ?? []).map((link) => link.student_id as string))];
  if (studentIds.length === 0) return [];

  const [{ data: profiles }, { data: enrollments }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name").in("id", studentIds),
    supabase.from("section_enrollments").select("id, student_id, section_id").in("student_id", studentIds),
  ]);
  const nameByStudent = new Map(
    ((profiles ?? []) as LinkedProfile[]).map((profile) => [
      profile.id,
      `${profile.first_name} ${profile.last_name}`.trim(),
    ]),
  );
  const enrollmentIds = ((enrollments ?? []) as EnrollmentRow[]).map((row) => row.id);
  if (enrollmentIds.length === 0) return [];

  const { data } = await supabase
    .from("student_task_progress")
    .select("status, student_id, task_instances(id, title, due_at, academic_sections(name))")
    .in("enrollment_id", enrollmentIds)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as ProgressRow[]).flatMap((row) => {
    const task = first(row.task_instances);
    if (!task) return [];
    const section = first(task.academic_sections);
    return [{
      studentId: row.student_id,
      childLabel: nameByStudent.get(row.student_id) ?? "",
      taskInstanceId: task.id,
      title: task.title,
      sectionName: section?.name ?? "",
      dueAt: task.due_at,
      status: row.status,
    }];
  });
}
