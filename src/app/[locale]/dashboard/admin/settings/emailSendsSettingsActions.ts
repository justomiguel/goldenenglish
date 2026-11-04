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
import { acceptEmailMonthlyCapInput, EMAIL_MONTHLY_CAP_KEY } from "@/lib/email/emailMonthlyCap";

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

export async function setEmailMonthlyCapAction(input: {
  locale: string;
  cap: number;
}): Promise<{ ok: true } | { ok: false; code: "invalid_cap" | "forbidden" | "write_failed" }> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("setEmailMonthlyCapAction");
    return { ok: false, code: "forbidden" };
  }

  const cap = acceptEmailMonthlyCapInput(input.cap);
  if (cap == null) return { ok: false, code: "invalid_cap" };

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: EMAIL_MONTHLY_CAP_KEY,
      value: cap as never,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) {
    logSupabaseClientError("setEmailMonthlyCapAction:write", error);
    return { ok: false, code: "write_failed" };
  }

  void recordSystemAudit({
    action: "email_monthly_cap_upsert",
    resourceType: "site_settings",
    resourceId: EMAIL_MONTHLY_CAP_KEY,
    payload: { cap },
  });

  revalidatePath(`/${input.locale}/dashboard/admin/settings`);
  revalidatePath(`/${input.locale}/dashboard/admin`);
  return { ok: true };
}
