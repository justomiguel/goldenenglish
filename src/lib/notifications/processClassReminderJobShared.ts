import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeClassReminderChannelPrefs } from "@/lib/notifications/mergeClassReminderChannelPrefs";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type ClassReminderJobRow = {
  id: string;
  kind: string;
  student_id: string;
  recipient_user_id: string;
  section_enrollment_id: string;
  payload: Record<string, unknown>;
  attempt_count: number;
};

export type ClassReminderDispatchDict = {
  prepEmailSubject: string;
  prepEmailLead: string;
  prepEmailScheduleLine: string;
  urgentInAppTitle: string;
  /** Template with {name}, {section}, {where} */
  urgentInAppBody: string;
  portalLinkLine: string;
  presencialRoomPrefix: string;
  onlineFallback: string;
};

export function strPayload(payload: Record<string, unknown>, key: string): string {
  const v = payload[key];
  return typeof v === "string" ? v : "";
}

export function numPayload(payload: Record<string, unknown>, key: string): number | null {
  const v = payload[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

export async function loadPrefs(admin: SupabaseClient, studentId: string) {
  const { data } = await admin
    .from("class_reminder_channel_prefs")
    .select(
      "email_class_prep, in_app_class_urgent, whatsapp_class_urgent, whatsapp_opt_in_at, whatsapp_phone_e164",
    )
    .eq("student_id", studentId)
    .maybeSingle();
  return mergeClassReminderChannelPrefs(data as never);
}

export async function markJob(
  admin: SupabaseClient,
  jobId: string,
  patch: Record<string, unknown>,
) {
  const { error } = await admin
    .from("class_reminder_jobs")
    .update({ ...patch, updated_at: new Date().toISOString() } as never)
    .eq("id", jobId);
  if (error) logSupabaseClientError("processClassReminderJob:markJob", error, { jobId });
}

export async function recordWhatsappPrefError(
  admin: SupabaseClient,
  studentId: string,
  code: string,
) {
  const { data: ex } = await admin
    .from("class_reminder_channel_prefs")
    .select("student_id")
    .eq("student_id", studentId)
    .maybeSingle();
  const now = new Date().toISOString();
  if (ex) {
    const { error } = await admin
      .from("class_reminder_channel_prefs")
      .update({ whatsapp_last_error_code: code, updated_at: now } as never)
      .eq("student_id", studentId);
    if (error)
      logSupabaseClientError("processClassReminderJob:whatsappPrefError:update", error, { studentId });
    return;
  }
  const { error } = await admin.from("class_reminder_channel_prefs").insert({
    student_id: studentId,
    email_class_prep: true,
    in_app_class_urgent: true,
    whatsapp_class_urgent: false,
    whatsapp_last_error_code: code,
    updated_at: now,
  } as never);
  if (error)
    logSupabaseClientError("processClassReminderJob:whatsappPrefError:insert", error, { studentId });
}
