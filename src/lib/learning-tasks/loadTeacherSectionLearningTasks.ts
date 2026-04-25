import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskProgressStatus } from "@/lib/learning-tasks/types";
import type { TeacherLearningTaskRow } from "@/types/learningTasks";

type InstanceRow = {
  id: string;
  title: string;
  section_id: string;
  due_at: string;
  academic_sections: { name: string } | { name: string }[] | null;
};

type ProgressRow = {
  task_instance_id: string;
  status: TaskProgressStatus;
};

function sectionName(raw: InstanceRow["academic_sections"]): string {
  if (!raw) return "";
  return Array.isArray(raw) ? (raw[0]?.name ?? "") : raw.name;
}

export async function loadTeacherSectionLearningTasks(
  supabase: SupabaseClient,
  sectionId: string,
  limit = 30,
): Promise<TeacherLearningTaskRow[]> {
  const { data: instances } = await supabase
    .from("task_instances")
    .select("id, title, section_id, due_at, academic_sections(name)")
    .eq("section_id", sectionId)
    .is("archived_at", null)
    .order("due_at", { ascending: false })
    .limit(limit);

  const rows = (instances ?? []) as InstanceRow[];
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const { data: progress } = await supabase
    .from("student_task_progress")
    .select("task_instance_id, status")
    .in("task_instance_id", ids);

  const counts = new Map<string, Record<TaskProgressStatus, number>>();
  for (const row of (progress ?? []) as ProgressRow[]) {
    const current = counts.get(row.task_instance_id) ?? {
      NOT_OPENED: 0,
      OPENED: 0,
      COMPLETED: 0,
      COMPLETED_LATE: 0,
    };
    current[row.status] += 1;
    counts.set(row.task_instance_id, current);
  }

  return rows.map((row) => {
    const c = counts.get(row.id) ?? { NOT_OPENED: 0, OPENED: 0, COMPLETED: 0, COMPLETED_LATE: 0 };
    return {
      taskInstanceId: row.id,
      title: row.title,
      sectionId: row.section_id,
      sectionName: sectionName(row.academic_sections),
      dueAt: row.due_at,
      total: c.NOT_OPENED + c.OPENED + c.COMPLETED + c.COMPLETED_LATE,
      notOpened: c.NOT_OPENED,
      opened: c.OPENED,
      completed: c.COMPLETED,
      completedLate: c.COMPLETED_LATE,
    };
  });
}
