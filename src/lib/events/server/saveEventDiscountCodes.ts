import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedEventDiscountCode } from "@/lib/events/parseEventDiscountCodeSheet";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

interface StoredCode {
  id: string;
  code_normalized: string;
}

/** Inserts or updates by code text. Does not delete codes that are absent from the list. */
export async function saveEventDiscountCodes(
  admin: SupabaseClient,
  eventId: string,
  rows: ParsedEventDiscountCode[],
): Promise<string[]> {
  if (rows.length === 0) return [];
  const { data, error } = await admin
    .from("event_discount_codes")
    .select("id, code_normalized")
    .eq("event_id", eventId);
  if (error) {
    logSupabaseClientError("saveEventDiscountCodes:list", error, { eventId });
    return [];
  }

  const existing = new Map<string, string>();
  for (const row of (data ?? []) as StoredCode[]) {
    existing.set(String(row.code_normalized), String(row.id));
  }

  const savedIds: string[] = [];
  for (const row of rows) {
    const key = row.code.trim().toLowerCase();
    const currentId = existing.get(key);
    if (currentId) {
      const { error: updateError } = await admin
        .from("event_discount_codes")
        .update({
          discount_percent: row.discountPercent,
          max_uses: row.maxUses,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentId);
      if (updateError) {
        logSupabaseClientError("saveEventDiscountCodes:update", updateError, { eventId });
        continue;
      }
      savedIds.push(currentId);
      continue;
    }

    const { data: inserted, error: insertError } = await admin
      .from("event_discount_codes")
      .insert({
        event_id: eventId,
        code: row.code.trim(),
        discount_percent: row.discountPercent,
        max_uses: row.maxUses,
      })
      .select("id")
      .maybeSingle();
    if (insertError || !inserted?.id) {
      logSupabaseClientError("saveEventDiscountCodes:insert", insertError ?? { message: "missing id" }, {
        eventId,
      });
      continue;
    }
    const id = String(inserted.id);
    existing.set(key, id);
    savedIds.push(id);
  }
  return savedIds;
}
