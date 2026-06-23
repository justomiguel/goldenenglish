import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENTS_BANK_TRANSFER_ENABLED_KEY } from "@/lib/events/eventsBankTransferSetting";

export interface UpdateEventsBankTransferEnabledResult {
  ok: boolean;
  error?: "db_error";
}

/** Persist the "accept bank transfer on event registration" toggle. */
export async function updateEventsBankTransferEnabledSetting(
  supabase: SupabaseClient,
  enabled: boolean,
): Promise<UpdateEventsBankTransferEnabledResult> {
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: EVENTS_BANK_TRANSFER_ENABLED_KEY,
      value: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    return { ok: false, error: "db_error" };
  }

  return { ok: true };
}
