import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function cancelPendingClassReminderJobs(
  admin: SupabaseClient,
  filter: { sectionEnrollmentId?: string; sectionId?: string },
  scope: string,
): Promise<{ ok: boolean }> {
  let q = admin.from("class_reminder_jobs").update({
    status: "cancelled",
    last_error_code: "cancelled_upstream",
    updated_at: new Date().toISOString(),
  } as never);
  q = q.eq("status", "pending");
  if (filter.sectionEnrollmentId) {
    q = q.eq("section_enrollment_id", filter.sectionEnrollmentId);
  }
  if (filter.sectionId) {
    q = q.eq("section_id", filter.sectionId);
  }
  const { error } = await q;
  if (error) {
    logSupabaseClientError(`${scope}:cancelPendingClassReminderJobs`, error, filter);
    return { ok: false };
  }
  return { ok: true };
}
