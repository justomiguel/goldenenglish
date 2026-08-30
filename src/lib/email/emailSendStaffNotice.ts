import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  EMAIL_SEND_LAST_FAILURE_KEY,
  parseEmailSendLastFailure,
  type EmailSendLastFailure,
  type EmailSendStaffNoticeReason,
} from "@/lib/email/emailSendStaffNoticeParse";

export {
  EMAIL_SEND_LAST_FAILURE_KEY,
  EMAIL_SEND_STAFF_NOTICE_REASONS,
  emailSendStaffNoticeIsActive,
  parseEmailSendLastFailure,
  type EmailSendLastFailure,
  type EmailSendStaffNoticeReason,
} from "@/lib/email/emailSendStaffNoticeParse";

async function upsertFailure(value: EmailSendLastFailure): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("site_settings").upsert(
      {
        key: EMAIL_SEND_LAST_FAILURE_KEY,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
    if (error) {
      logSupabaseClientError("emailSendStaffNotice:upsert", error, { templateKey: value.templateKey });
    }
  } catch (err) {
    logServerException("emailSendStaffNotice:upsert", err, { templateKey: value.templateKey });
  }
}

export async function recordEmailSendStaffNotice(input: {
  templateKey: string;
  reason: EmailSendStaffNoticeReason;
}): Promise<void> {
  await upsertFailure({
    at: new Date().toISOString(),
    templateKey: input.templateKey,
    reason: input.reason,
    dismissedAt: null,
  });
}

export async function clearEmailSendStaffNotice(): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("site_settings").delete().eq("key", EMAIL_SEND_LAST_FAILURE_KEY);
    if (error) logSupabaseClientError("emailSendStaffNotice:clear", error);
  } catch (err) {
    logServerException("emailSendStaffNotice:clear", err);
  }
}

export async function loadEmailSendStaffNotice(
  supabase: SupabaseClient,
): Promise<EmailSendLastFailure | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", EMAIL_SEND_LAST_FAILURE_KEY)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("emailSendStaffNotice:load", error);
    return null;
  }
  const parsed = parseEmailSendLastFailure(data?.value);
  if (!parsed || parsed.dismissedAt) return null;
  return parsed;
}

export async function dismissEmailSendStaffNotice(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", EMAIL_SEND_LAST_FAILURE_KEY)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("emailSendStaffNotice:dismissRead", error);
    return false;
  }
  const parsed = parseEmailSendLastFailure(data?.value);
  if (!parsed) return true;
  const { error: writeError } = await supabase.from("site_settings").upsert(
    {
      key: EMAIL_SEND_LAST_FAILURE_KEY,
      value: { ...parsed, dismissedAt: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (writeError) {
    logSupabaseClientError("emailSendStaffNotice:dismissWrite", writeError);
    return false;
  }
  return true;
}
