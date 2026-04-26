import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { ADMIN_SECTION_HEALTH_CHUNK } from "@/lib/academics/adminSectionHealthSnapshotChunk";

const TASK_INSTANCE_CAP = 400;

export type AdminSectionHealthTaskProgress = {
  notOpened: number;
  opened: number;
  completed: number;
  progressRows: number;
};

export async function loadAdminSectionHealthTaskProgress(
  supabase: SupabaseClient,
  input: { sectionId: string; activeEnrollmentIds: string[]; taskInstanceTotal: number },
): Promise<AdminSectionHealthTaskProgress> {
  const { sectionId, activeEnrollmentIds, taskInstanceTotal } = input;
  let notOpened = 0;
  let opened = 0;
  let completed = 0;
  let progressRows = 0;

  if (activeEnrollmentIds.length === 0 || taskInstanceTotal <= 0) {
    return { notOpened, opened, completed, progressRows };
  }

  const chunk = ADMIN_SECTION_HEALTH_CHUNK;
  const { data: instRows, error: instErr } = await supabase
    .from("task_instances")
    .select("id")
    .eq("section_id", sectionId)
    .is("archived_at", null)
    .limit(TASK_INSTANCE_CAP);
  if (instErr) {
    logSupabaseClientError("loadAdminSectionHealthSnapshot:taskInstanceIds", instErr, { sectionId });
    return { notOpened, opened, completed, progressRows };
  }

  const taskIds = (instRows ?? []).map((r) => (r as { id: string }).id);
  const statuses: string[] = [];
  for (let t = 0; t < taskIds.length; t += chunk) {
    const tBatch = taskIds.slice(t, t + chunk);
    for (let e = 0; e < activeEnrollmentIds.length; e += chunk) {
      const eBatch = activeEnrollmentIds.slice(e, e + chunk);
      const { data: stp, error: stpErr } = await supabase
        .from("student_task_progress")
        .select("status")
        .in("task_instance_id", tBatch)
        .in("enrollment_id", eBatch);
      if (stpErr) {
        logSupabaseClientError("loadAdminSectionHealthSnapshot:stpSelect", stpErr, { sectionId });
        continue;
      }
      for (const row of stp ?? []) {
        statuses.push(String((row as { status: string }).status));
      }
    }
  }
  progressRows = statuses.length;
  for (const s of statuses) {
    if (s === "COMPLETED" || s === "COMPLETED_LATE") completed += 1;
    else if (s === "OPENED") opened += 1;
    else notOpened += 1;
  }

  return { notOpened, opened, completed, progressRows };
}
