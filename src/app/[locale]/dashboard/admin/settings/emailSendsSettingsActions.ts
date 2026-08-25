"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { isKnownEmailTemplateKey } from "@/lib/email/templates/templateRegistry";
import {
  CLASS_REMINDER_TEMPLATE_KEY,
  CLASS_REMINDERS_ENABLED_KEY,
  EMAIL_SENDS_ENABLED_KEY,
  parseEmailSendsEnabled,
} from "@/lib/email/emailSendsEnabled";

export async function setEmailSendEnabledAction(input: {
  locale: string;
  templateKey: string;
  enabled: boolean;
}): Promise<{ ok: boolean }> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("setEmailSendEnabledAction");
    return { ok: false };
  }

  if (!isKnownEmailTemplateKey(input.templateKey)) return { ok: false };

  const supabase = await createClient();
  const { data, error: readError } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", EMAIL_SENDS_ENABLED_KEY)
    .maybeSingle();
  if (readError) {
    logSupabaseClientError("setEmailSendEnabledAction:read", readError);
    return { ok: false };
  }

  const nextMap = {
    ...parseEmailSendsEnabled(data?.value),
    [input.templateKey]: input.enabled,
  };
  const now = new Date().toISOString();
  const { error: writeError } = await supabase.from("site_settings").upsert(
    {
      key: EMAIL_SENDS_ENABLED_KEY,
      value: nextMap as never,
      updated_at: now,
    },
    { onConflict: "key" },
  );
  if (writeError) {
    logSupabaseClientError("setEmailSendEnabledAction:write", writeError);
    return { ok: false };
  }

  if (input.templateKey === CLASS_REMINDER_TEMPLATE_KEY) {
    const { error: reminderError } = await supabase.from("site_settings").upsert(
      {
        key: CLASS_REMINDERS_ENABLED_KEY,
        value: input.enabled as never,
        updated_at: now,
      },
      { onConflict: "key" },
    );
    if (reminderError) {
      logSupabaseClientError("setEmailSendEnabledAction:classReminders", reminderError);
      return { ok: false };
    }
  }

  void recordSystemAudit({
    action: "email_sends_enabled_upsert",
    resourceType: "site_settings",
    resourceId: EMAIL_SENDS_ENABLED_KEY,
    payload: { templateKey: input.templateKey, enabled: input.enabled },
  });

  revalidatePath(`/${input.locale}/dashboard/admin/settings`);
  return { ok: true };
}
