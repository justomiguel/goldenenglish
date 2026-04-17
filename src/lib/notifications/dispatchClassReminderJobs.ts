import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultLocale, getDictionary } from "@/lib/i18n/dictionaries";
import {
  processClassReminderJob,
  type ClassReminderDispatchDict,
  type ClassReminderJobRow,
} from "@/lib/notifications/processClassReminderJob";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function dispatchClassReminderJobs(admin: SupabaseClient): Promise<{ processed: number }> {
  const dict = await getDictionary(defaultLocale);
  const cr = dict.notifications.classReminders;
  const dispatchDict: ClassReminderDispatchDict = {
    prepEmailSubject: cr.prepEmailSubject,
    prepEmailLead: cr.prepEmailLead,
    prepEmailScheduleLine: cr.prepEmailScheduleLine,
    urgentInAppTitle: cr.urgentInAppTitle,
    urgentInAppBody: cr.urgentInAppBody,
    portalLinkLine: cr.portalLinkLine,
    presencialRoomPrefix: cr.presencialRoomPrefix,
    onlineFallback: cr.onlineFallback,
  };

  const nowIso = new Date().toISOString();
  const { data: due, error: dErr } = await admin
    .from("class_reminder_jobs")
    .select("id")
    .eq("status", "pending")
    .lte("send_at", nowIso)
    .order("send_at", { ascending: true })
    .limit(35);
  if (dErr) {
    logSupabaseClientError("dispatchClassReminderJobs:list", dErr);
    return { processed: 0 };
  }

  let processed = 0;
  for (const row of due ?? []) {
    const id = (row as { id: string }).id;
    const { data: claimed, error: cErr } = await admin
      .from("class_reminder_jobs")
      .update({ status: "processing" } as never)
      .eq("id", id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();
    if (cErr || !claimed) continue;
    await processClassReminderJob({
      admin,
      job: claimed as ClassReminderJobRow,
      dict: dispatchDict,
    });
    processed += 1;
  }
  return { processed };
}
