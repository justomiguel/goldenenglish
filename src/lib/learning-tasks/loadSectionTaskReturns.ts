import type { SupabaseClient } from "@supabase/supabase-js";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type SectionTaskReturnRow = {
  progressId: string;
  studentLabel: string;
  taskTitle: string;
  status: string;
  answer: string | null;
};

type ProgressJoin = {
  id: string;
  status: string;
  student_id: string;
  task_instances: { title: string } | { title: string }[] | null;
};

export async function loadSectionTaskReturns(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<SectionTaskReturnRow[]> {
  const { data, error } = await supabase
    .from("student_task_progress")
    .select("id, status, student_id, task_instances!inner(title, section_id)")
    .eq("task_instances.section_id", sectionId)
    .in("status", ["COMPLETED", "COMPLETED_LATE", "RETURNED"])
    .order("updated_at", { ascending: false })
    .limit(80);
  if (error) {
    logSupabaseClientError("loadSectionTaskReturns:progress", error, { sectionId });
    return [];
  }
  const rows = (data ?? []) as ProgressJoin[];
  const progressIds = rows.map((row) => row.id);
  const studentIds = [...new Set(rows.map((row) => row.student_id))];
  const [answers, profiles] = await Promise.all([
    progressIds.length
      ? supabase
          .from("student_task_submissions")
          .select("progress_id, body_text, created_at")
          .in("progress_id", progressIds)
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length
      ? supabase.from("profiles").select("id, first_name, last_name").in("id", studentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (answers.error) logSupabaseClientError("loadSectionTaskReturns:answers", answers.error, { sectionId });
  if (profiles.error) logSupabaseClientError("loadSectionTaskReturns:profiles", profiles.error, { sectionId });

  const answerByProgress = new Map<string, string>();
  for (const row of (answers.data ?? []) as { progress_id: string; body_text: string }[]) {
    if (!answerByProgress.has(row.progress_id)) answerByProgress.set(row.progress_id, row.body_text);
  }
  const nameById = new Map(
    ((profiles.data ?? []) as { id: string; first_name: string | null; last_name: string | null }[]).map((row) => [
      row.id,
      formatProfileNameSurnameFirst(row.first_name, row.last_name),
    ]),
  );

  return rows.map((row) => {
    const task = Array.isArray(row.task_instances) ? row.task_instances[0] : row.task_instances;
    return {
      progressId: row.id,
      studentLabel: nameById.get(row.student_id) || row.student_id,
      taskTitle: task?.title ?? "",
      status: row.status,
      answer: answerByProgress.get(row.id) ?? null,
    };
  });
}
