import type { SupabaseClient } from "@supabase/supabase-js";
import { mapLearningTaskAssetRows, type RawLearningTaskAsset } from "@/lib/learning-tasks/mapAssetRows";
import type { StudentLearningTaskRow } from "@/types/learningTasks";
import type { TaskProgressStatus } from "@/lib/learning-tasks/types";

type ProgressQueryRow = {
  id: string;
  status: TaskProgressStatus;
  opened_at: string | null;
  completed_at: string | null;
  task_instances:
    | {
        id: string;
        title: string;
        body_html: string;
        start_at: string;
        due_at: string;
        academic_sections: { name: string } | { name: string }[] | null;
      }
    | {
        id: string;
        title: string;
        body_html: string;
        start_at: string;
        due_at: string;
        academic_sections: { name: string } | { name: string }[] | null;
      }[]
    | null;
};

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function loadStudentLearningTasks(
  supabase: SupabaseClient,
  studentId: string,
  limit = 20,
): Promise<StudentLearningTaskRow[]> {
  const { data } = await supabase
    .from("student_task_progress")
    .select(
      "id, status, opened_at, completed_at, task_instances(id, title, body_html, start_at, due_at, academic_sections(name))",
    )
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as ProgressQueryRow[];
  const taskIds = rows.map((row) => first(row.task_instances)?.id).filter((id): id is string => Boolean(id));
  const assetsByTask = new Map<string, RawLearningTaskAsset[]>();
  if (taskIds.length > 0) {
    const { data: assets } = await supabase
      .from("task_instance_assets")
      .select("id, task_instance_id, kind, label, storage_path, mime_type, byte_size, embed_provider, embed_url")
      .in("task_instance_id", taskIds)
      .order("sort_order", { ascending: true });
    for (const asset of assets ?? []) {
      const taskId = asset.task_instance_id as string;
      const next = assetsByTask.get(taskId) ?? [];
      next.push(asset as RawLearningTaskAsset);
      assetsByTask.set(taskId, next);
    }
  }

  return rows.flatMap((row) => {
    const task = first(row.task_instances);
    if (!task) return [];
    const section = first(task.academic_sections);
    return [{
      taskInstanceId: task.id,
      progressId: row.id,
      title: task.title,
      bodyHtml: task.body_html,
      sectionName: section?.name ?? "",
      startAt: task.start_at,
      dueAt: task.due_at,
      status: row.status,
      openedAt: row.opened_at,
      completedAt: row.completed_at,
      assets: mapLearningTaskAssetRows(assetsByTask.get(task.id) ?? []),
    }];
  });
}
