import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { escapeHtml } from "@/lib/academics/escapeHtml";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { logServerException } from "@/lib/logging/serverActionLog";
import {
  loadPrefs,
  markJob,
  type ClassReminderDispatchDict,
  type ClassReminderJobRow,
} from "@/lib/notifications/processClassReminderJobShared";
import {
  buildClassReminderJobLocation,
  handlePrepEmailJob,
  handleUrgentInAppJob,
  handleUrgentWhatsappJob,
} from "@/lib/notifications/processClassReminderJobHandlers";

export type {
  ClassReminderJobRow,
  ClassReminderDispatchDict,
} from "@/lib/notifications/processClassReminderJobShared";

export async function processClassReminderJob(input: {
  admin: SupabaseClient;
  job: ClassReminderJobRow;
  dict: ClassReminderDispatchDict;
  emailProvider?: EmailProvider;
}): Promise<void> {
  const adminAuth = createAdminClient();
  const emailProvider = input.emailProvider ?? getEmailProvider();
  const prefs = await loadPrefs(input.admin, input.job.student_id);
  const { sectionLabel, locationLinePlain } = buildClassReminderJobLocation(
    input.job.payload,
    input.dict,
  );

  const portal = absoluteUrl("/es/dashboard");
  const portalLine = portal
    ? `<p><a href="${escapeHtml(portal.href)}">${escapeHtml(input.dict.portalLinkLine)}</a></p>`
    : "";

  try {
    if (input.job.kind === "prep_email") {
      await handlePrepEmailJob({
        admin: input.admin,
        adminAuth,
        emailProvider,
        job: input.job,
        prefs,
        dict: input.dict,
        sectionLabel,
        locationLinePlain,
        portalLine,
      });
      return;
    }
    if (input.job.kind === "urgent_in_app") {
      await handleUrgentInAppJob({
        admin: input.admin,
        job: input.job,
        prefs,
        dict: input.dict,
        sectionLabel,
        locationLinePlain,
      });
      return;
    }
    if (input.job.kind === "urgent_whatsapp") {
      await handleUrgentWhatsappJob({
        admin: input.admin,
        job: input.job,
        prefs,
        sectionLabel,
        locationLinePlain,
      });
    }
  } catch (err) {
    logServerException("processClassReminderJob", err, { jobId: input.job.id });
    await markJob(input.admin, input.job.id, {
      status: "failed",
      last_error_code: "exception",
      attempt_count: input.job.attempt_count + 1,
    });
  }
}
