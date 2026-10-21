import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  EVENT_DISCOUNT_CODE_USE_CAP,
  mapEventDiscountCodeUses,
  type EventDiscountCodeUse,
} from "@/lib/events/mapEventDiscountCodeUses";

export async function loadEventDiscountCodeUses(
  admin: SupabaseClient,
  codeIds: string[],
): Promise<{ uses: EventDiscountCodeUse[]; truncated: boolean }> {
  if (codeIds.length === 0) return { uses: [], truncated: false };
  const { data, error } = await admin
    .from("event_discount_code_redemptions")
    .select(
      "id, code_id, status, created_at, event_attendees(first_name, last_name, email, event_payments(status))",
    )
    .in("code_id", codeIds)
    .order("created_at", { ascending: false })
    .range(0, EVENT_DISCOUNT_CODE_USE_CAP - 1);
  if (error) {
    logSupabaseClientError("loadEventDiscountCodeUses", error, {});
    return { uses: [], truncated: false };
  }
  return mapEventDiscountCodeUses(data ?? []);
}
