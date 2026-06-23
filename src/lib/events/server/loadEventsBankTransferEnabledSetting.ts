import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EVENTS_BANK_TRANSFER_ENABLED_DEFAULT,
  EVENTS_BANK_TRANSFER_ENABLED_KEY,
  parseEventsBankTransferEnabled,
} from "@/lib/events/eventsBankTransferSetting";

/** Current admin-facing value of the event registration bank transfer toggle. */
export async function loadEventsBankTransferEnabledSetting(
  supabase: SupabaseClient,
): Promise<{ enabled: boolean }> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", EVENTS_BANK_TRANSFER_ENABLED_KEY)
    .maybeSingle();

  const explicit = parseEventsBankTransferEnabled(data?.value);
  return { enabled: explicit ?? EVENTS_BANK_TRANSFER_ENABLED_DEFAULT };
}
