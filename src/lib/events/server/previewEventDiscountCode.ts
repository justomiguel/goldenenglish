import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { applyEventCodeDiscount } from "@/lib/events/applyEventCodeDiscount";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type PreviewEventDiscountCodeResult =
  | { ok: true; kind: "percent"; percent: number; amount: number }
  | { ok: true; kind: "amount"; discountAmount: number; ticketCount: number }
  | { ok: false; code: "invalid_code" | "no_uses" };

/** Prices a code. It does not insert a redemption. */
export async function previewEventDiscountCode(
  admin: SupabaseClient,
  input: { eventId: string; code: string; amount: number; currency: string },
): Promise<PreviewEventDiscountCodeResult> {
  const normalized = input.code.trim().toLowerCase();
  if (!normalized || normalized.length > 32) return { ok: false, code: "invalid_code" };

  const { data: codeRow, error } = await admin
    .from("event_discount_codes")
    .select("id, discount_percent, discount_amount, ticket_count, max_uses")
    .eq("event_id", input.eventId)
    .eq("code_normalized", normalized)
    .maybeSingle();

  if (error) {
    logSupabaseClientError("previewEventDiscountCode:code", error, { eventId: input.eventId });
    return { ok: false, code: "invalid_code" };
  }
  if (!codeRow?.id) return { ok: false, code: "invalid_code" };

  if (codeRow.max_uses != null) {
    const { count, error: countError } = await admin
      .from("event_discount_code_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("code_id", codeRow.id)
      .in("status", ["reserved", "consumed"]);
    if (countError) {
      logSupabaseClientError("previewEventDiscountCode:count", countError, { eventId: input.eventId });
      return { ok: false, code: "invalid_code" };
    }
    if ((count ?? 0) >= Number(codeRow.max_uses)) return { ok: false, code: "no_uses" };
  }

  if (codeRow.discount_amount != null && codeRow.ticket_count != null) {
    return {
      ok: true,
      kind: "amount",
      discountAmount: Number(codeRow.discount_amount),
      ticketCount: Number(codeRow.ticket_count),
    };
  }

  const percent = Number(codeRow.discount_percent);
  return {
    ok: true,
    kind: "percent",
    percent,
    amount: applyEventCodeDiscount({
      amount: input.amount,
      percent,
      currency: input.currency,
    }),
  };
}
