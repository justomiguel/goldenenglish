import type { SupabaseClient } from "@supabase/supabase-js";
import { locales, type AppLocale } from "@/lib/i18n/dictionaries";
import {
  MESSAGING_DEFAULT_REPLY_MAX_LENGTH,
  MESSAGING_DEFAULT_REPLY_SETTING_KEY,
  type MessagingDefaultReplyTemplates,
} from "@/lib/messaging/messagingDefaultReplyConstants";
import { templatesPayload } from "@/lib/messaging/parseMessagingDefaultReplySetting";

export type UpdateMessagingDefaultReplyResult =
  | { ok: true }
  | { ok: false; error: "empty" | "too_long" | "db_error" };

export async function updateMessagingDefaultReplyTemplate(
  supabase: SupabaseClient,
  templatesRaw: MessagingDefaultReplyTemplates,
): Promise<UpdateMessagingDefaultReplyResult> {
  const templates = {} as MessagingDefaultReplyTemplates;
  for (const loc of locales) {
    const key = loc as AppLocale;
    const trimmed = templatesRaw[key]?.trim() ?? "";
    if (!trimmed) return { ok: false, error: "empty" };
    if (trimmed.length > MESSAGING_DEFAULT_REPLY_MAX_LENGTH) {
      return { ok: false, error: "too_long" };
    }
    templates[key] = trimmed;
  }

  const { error } = await supabase.from("site_settings").upsert(
    {
      key: MESSAGING_DEFAULT_REPLY_SETTING_KEY,
      value: templatesPayload(templates),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) return { ok: false, error: "db_error" };
  return { ok: true };
}
