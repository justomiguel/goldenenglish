import { createAdminClient } from "@/lib/supabase/admin";
import { cancelPendingClassReminderJobs } from "@/lib/notifications/cancelPendingClassReminderJobs";
import { logServerException } from "@/lib/logging/serverActionLog";

export async function cancelReminderJobsForEnrollmentId(
  enrollmentId: string,
  scope: string,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await cancelPendingClassReminderJobs(admin, { sectionEnrollmentId: enrollmentId }, scope);
  } catch (err) {
    logServerException(`${scope}:cancelReminderJobsForEnrollmentId`, err, { enrollmentId });
  }
}

export async function cancelReminderJobsForSectionId(sectionId: string, scope: string): Promise<void> {
  try {
    const admin = createAdminClient();
    await cancelPendingClassReminderJobs(admin, { sectionId }, scope);
  } catch (err) {
    logServerException(`${scope}:cancelReminderJobsForSectionId`, err, { sectionId });
  }
}
