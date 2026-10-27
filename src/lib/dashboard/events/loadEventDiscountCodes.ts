import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { EventDiscountCodeUse } from "@/lib/events/mapEventDiscountCodeUses";

export interface EventDiscountCodeListRow {
  id: string;
  code: string;
  kind: "percent" | "amount";
  discountPercent: number | null;
  discountAmount: number | null;
  ticketCount: number | null;
  maxUses: number | null;
  reserved: number;
  consumed: number;
  uses?: EventDiscountCodeUse[];
}

export async function loadEventDiscountCodeCount(
  admin: SupabaseClient,
  eventId: string,
): Promise<number> {
  const { count, error } = await admin
    .from("event_discount_codes")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);
  if (error) {
    logSupabaseClientError("loadEventDiscountCodeCount", error, { eventId });
    return 0;
  }
  return count ?? 0;
}

export async function loadEventDiscountCodes(
  admin: SupabaseClient,
  eventId: string,
): Promise<EventDiscountCodeListRow[]> {
  const { data, error } = await admin
    .from("event_discount_codes")
    .select("id, code, discount_percent, discount_amount, ticket_count, max_uses")
    .eq("event_id", eventId)
    .order("code", { ascending: true })
    .range(0, 499);
  if (error) {
    logSupabaseClientError("loadEventDiscountCodes", error, { eventId });
    return [];
  }
  const codes = data ?? [];
  const ids = codes.map((row) => String(row.id));
  const counts = new Map<string, { reserved: number; consumed: number }>();
  if (ids.length > 0) {
    const { data: redemptions, error: redemptionError } = await admin
      .from("event_discount_code_redemptions")
      .select("code_id, status")
      .in("code_id", ids)
      .in("status", ["reserved", "consumed"]);
    if (redemptionError) {
      logSupabaseClientError("loadEventDiscountCodes:redemptions", redemptionError, { eventId });
    }
    for (const row of redemptions ?? []) {
      const id = String(row.code_id);
      const current = counts.get(id) ?? { reserved: 0, consumed: 0 };
      if (row.status === "reserved") current.reserved += 1;
      if (row.status === "consumed") current.consumed += 1;
      counts.set(id, current);
    }
  }
  return codes.map((row) => {
    const usage = counts.get(String(row.id)) ?? { reserved: 0, consumed: 0 };
    const discountAmount = row.discount_amount == null ? null : Number(row.discount_amount);
    const ticketCount = row.ticket_count == null ? null : Number(row.ticket_count);
    const kind = discountAmount != null && ticketCount != null ? "amount" : "percent";
    return {
      id: String(row.id),
      code: String(row.code),
      kind,
      discountPercent: row.discount_percent == null ? null : Number(row.discount_percent),
      discountAmount,
      ticketCount,
      maxUses: row.max_uses == null ? null : Number(row.max_uses),
      reserved: usage.reserved,
      consumed: usage.consumed,
    };
  });
}
