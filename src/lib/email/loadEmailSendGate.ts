import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseClassReminderSiteSettings } from "@/lib/notifications/parseClassReminderSiteSettings";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  CLASS_REMINDERS_ENABLED_KEY,
  EMAIL_SENDS_ENABLED_KEY,
  parseEmailSendsEnabled,
} from "@/lib/email/emailSendsEnabled";

export type EmailSendGate = {
  map: Record<string, boolean>;
  classRemindersEnabled: boolean;
};

const FAIL_OPEN: EmailSendGate = { map: {}, classRemindersEnabled: true };

export async function loadEmailSendGate(): Promise<EmailSendGate> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("site_settings")
      .select("key, value")
      .in("key", [EMAIL_SENDS_ENABLED_KEY, CLASS_REMINDERS_ENABLED_KEY]);
    if (error || !data) {
      if (error) logSupabaseClientError("loadEmailSendGate", error);
      return FAIL_OPEN;
    }
    const rows = data as { key: string; value: unknown }[];
    const sendsRow = rows.find((r) => r.key === EMAIL_SENDS_ENABLED_KEY);
    return {
      map: parseEmailSendsEnabled(sendsRow?.value),
      classRemindersEnabled: parseClassReminderSiteSettings(rows).remindersEnabled,
    };
  } catch (err) {
    logServerException("loadEmailSendGate", err);
    return FAIL_OPEN;
  }
}
