import type { SupabaseClient } from "@supabase/supabase-js";
import { attendancePercent } from "@/lib/courses/courseResult";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const SCOPE = "loadCourseResultInputs";

export async function loadCourseResultInputs(
  supabase: SupabaseClient,
  studentId: string,
  sectionIds: readonly string[],
): Promise<{ tasks: { sectionId: string; status: string }[]; attendancePercent: number | null }> {
  const now = new Date();
  const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  const uniqueSections = [...new Set(sectionIds)].slice(0, 40);

  const [taskResult, attendanceResult] = await Promise.all([
    uniqueSections.length
      ? supabase
          .from("student_task_progress")
          .select("status, task_instances!inner(section_id)")
          .eq("student_id", studentId)
          .in("task_instances.section_id", uniqueSections)
          .limit(400)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("section_attendance")
      .select("status, section_enrollments!inner(student_id)")
      .eq("section_enrollments.student_id", studentId)
      .gte("attended_on", monthStart)
      .lte("attended_on", monthEnd)
      .limit(400),
  ]);

  if (taskResult.error) logSupabaseClientError(`${SCOPE}:tasks`, taskResult.error, { studentId });
  if (attendanceResult.error) {
    logSupabaseClientError(`${SCOPE}:attendance`, attendanceResult.error, { studentId });
  }

  const tasks = ((taskResult.data ?? []) as { status: string; task_instances: { section_id: string } | { section_id: string }[] }[])
    .flatMap((row) => {
      const task = Array.isArray(row.task_instances) ? row.task_instances[0] : row.task_instances;
      return task ? [{ sectionId: task.section_id, status: row.status }] : [];
    });
  const marks = ((attendanceResult.error ? [] : attendanceResult.data) ?? []) as { status: string }[];
  return { tasks, attendancePercent: attendancePercent(marks) };
}
