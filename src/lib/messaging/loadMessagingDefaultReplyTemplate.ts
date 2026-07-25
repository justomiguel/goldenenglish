import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATES,
  MESSAGING_DEFAULT_REPLY_SETTING_KEY,
  type MessagingDefaultReplyTemplates,
} from "@/lib/messaging/messagingDefaultReplyConstants";
import { parseMessagingDefaultReplySetting } from "@/lib/messaging/parseMessagingDefaultReplySetting";

/** Load institute-wide admin default reply templates from site_settings. */
export async function loadMessagingDefaultReplyTemplate(
  supabase: SupabaseClient,
  factories: MessagingDefaultReplyTemplates = MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATES,
): Promise<{ templates: MessagingDefaultReplyTemplates }> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", MESSAGING_DEFAULT_REPLY_SETTING_KEY)
    .maybeSingle();

  return { templates: parseMessagingDefaultReplySetting(data?.value, factories) };
}
