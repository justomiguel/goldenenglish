import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { escapeHtml } from "@/lib/academics/escapeHtml";
import { isValidE164Phone } from "@/lib/notifications/validateE164Phone";
import { sendMetaClassReminderTemplate } from "@/lib/whatsapp/sendMetaClassReminderTemplate";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import {
  markJob,
  numPayload,
  recordWhatsappPrefError,
  strPayload,
  type ClassReminderDispatchDict,
  type ClassReminderJobRow,
} from "@/lib/notifications/processClassReminderJobShared";
import type { mergeClassReminderChannelPrefs } from "@/lib/notifications/mergeClassReminderChannelPrefs";

type Prefs = ReturnType<typeof mergeClassReminderChannelPrefs>;

export async function handlePrepEmailJob(input: {
  admin: SupabaseClient;
  adminAuth: SupabaseClient;
  emailProvider: EmailProvider;
  job: ClassReminderJobRow;
  prefs: Prefs;
  dict: ClassReminderDispatchDict;
  sectionLabel: string;
  locationLinePlain: string;
  portalLine: string;
}): Promise<void> {
  const { admin, adminAuth, emailProvider, job, prefs, dict } = input;
  if (!prefs.email_class_prep) {
    await markJob(admin, job.id, {
      status: "sent",
      channels_snapshot: { skipped: "email_disabled" },
    });
    return;
  }
  const { data: authUser } = await adminAuth.auth.admin.getUserById(job.recipient_user_id);
  const to = authUser.user?.email?.trim();
  if (!to) {
    await markJob(admin, job.id, {
      status: "failed",
      last_error_code: "no_recipient_email",
    });
    return;
  }
  const occurrenceStartMs = numPayload(job.payload, "occurrenceStartMs");
  const whenLine =
    occurrenceStartMs != null
      ? escapeHtml(
          new Intl.DateTimeFormat("es", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(occurrenceStartMs)),
        )
      : "";
  const r = await sendBrandedEmail({
    to,
    templateKey: "notifications.class_reminder_prep",
    locale: "es",
    emailProvider,
    vars: {
      lead: escapeHtml(dict.prepEmailLead),
      sectionLabel: escapeHtml(input.sectionLabel),
      scheduleLineLabel: escapeHtml(dict.prepEmailScheduleLine),
      whenLine,
      locationLine: escapeHtml(input.locationLinePlain),
      portalLine: input.portalLine,
    },
  });
  if (!r.ok) {
    await markJob(admin, job.id, {
      status: "failed",
      last_error_code: "email_send_failed",
      attempt_count: job.attempt_count + 1,
    });
    return;
  }
  await markJob(admin, job.id, { status: "sent", channels_snapshot: { email: "sent" } });
}

export async function handleUrgentInAppJob(input: {
  admin: SupabaseClient;
  job: ClassReminderJobRow;
  prefs: Prefs;
  dict: ClassReminderDispatchDict;
  sectionLabel: string;
  locationLinePlain: string;
}): Promise<void> {
  const { admin, job, prefs, dict, sectionLabel, locationLinePlain } = input;
  if (!prefs.in_app_class_urgent) {
    await markJob(admin, job.id, {
      status: "sent",
      channels_snapshot: { skipped: "in_app_disabled" },
    });
    return;
  }
  const { data: profN } = await admin
    .from("profiles")
    .select("first_name")
    .eq("id", job.recipient_user_id)
    .maybeSingle();
  const namePlain =
    String((profN as { first_name?: string } | null)?.first_name ?? "").trim() || "—";
  const body = dict.urgentInAppBody
    .replace(/\{name\}/g, namePlain)
    .replace(/\{section\}/g, sectionLabel)
    .replace(/\{where\}/g, locationLinePlain);
  const { data: existingInApp } = await admin
    .from("class_reminder_in_app")
    .select("id")
    .eq("job_id", job.id)
    .maybeSingle();
  let insErr: { message?: string } | null = null;
  if (!existingInApp) {
    const ins = await admin.from("class_reminder_in_app").insert({
      recipient_user_id: job.recipient_user_id,
      job_id: job.id,
      title: dict.urgentInAppTitle,
      body,
    } as never);
    insErr = ins.error;
  }
  if (insErr) {
    logSupabaseClientError("processClassReminderJob:in_app", insErr, { jobId: job.id });
    await markJob(admin, job.id, {
      status: "failed",
      last_error_code: "in_app_insert_failed",
      attempt_count: job.attempt_count + 1,
    });
    return;
  }
  await markJob(admin, job.id, { status: "sent", channels_snapshot: { in_app: "sent" } });
}

export async function handleUrgentWhatsappJob(input: {
  admin: SupabaseClient;
  job: ClassReminderJobRow;
  prefs: Prefs;
  sectionLabel: string;
  locationLinePlain: string;
}): Promise<void> {
  const { admin, job, prefs, sectionLabel, locationLinePlain } = input;
  if (!prefs.whatsapp_class_urgent || !prefs.whatsapp_opt_in_at) {
    await markJob(admin, job.id, {
      status: "sent",
      channels_snapshot: { skipped: "whatsapp_opt_out" },
    });
    return;
  }
  const phone = prefs.whatsapp_phone_e164?.trim() ?? "";
  if (!isValidE164Phone(phone)) {
    await recordWhatsappPrefError(admin, job.student_id, "invalid_e164_phone");
    await markJob(admin, job.id, { status: "failed", last_error_code: "invalid_e164_phone" });
    return;
  }
  const { data: prof } = await admin
    .from("profiles")
    .select("first_name")
    .eq("id", job.recipient_user_id)
    .maybeSingle();
  const first =
    String((prof as { first_name?: string } | null)?.first_name ?? "").trim() || "—";
  const wa = await sendMetaClassReminderTemplate({
    toE164: phone,
    bodyParameters: [first, sectionLabel, locationLinePlain],
  });
  if (!wa.ok) {
    const code = wa.code;
    if (code === "whatsapp_api_error" || code === "whatsapp_http_error") {
      await recordWhatsappPrefError(admin, job.student_id, code);
    }
    await markJob(admin, job.id, {
      status: "failed",
      last_error_code: code,
      attempt_count: job.attempt_count + 1,
    });
    return;
  }
  await markJob(admin, job.id, { status: "sent", channels_snapshot: { whatsapp: "sent" } });
}

export function buildClassReminderJobLocation(
  payload: Record<string, unknown>,
  dict: ClassReminderDispatchDict,
): { sectionLabel: string; locationLinePlain: string } {
  const sectionLabel = strPayload(payload, "sectionLabel");
  const roomLabel = strPayload(payload, "roomLabel");
  const locationLinePlain = roomLabel
    ? `${dict.presencialRoomPrefix} ${roomLabel}`.trim()
    : dict.onlineFallback;
  return { sectionLabel, locationLinePlain };
}
