import type { SupabaseClient } from "@supabase/supabase-js";
import { periodIndex } from "@/lib/billing/scholarshipPeriod";

export type AdvanceMonthlyPaymentDenyReason = "future_month_not_allowed";

/**
 * Returns whether a payment action is allowed for the given section/month.
 * Past and current months are always allowed; future months require the section flag.
 */
export async function assertAdvanceMonthlyPaymentAllowed(
  supabase: SupabaseClient,
  input: {
    sectionId: string | null;
    year: number;
    month: number;
    todayYear: number;
    todayMonth: number;
  },
): Promise<{ allowed: true } | { allowed: false; reason: AdvanceMonthlyPaymentDenyReason }> {
  const { sectionId, year, month, todayYear, todayMonth } = input;
  if (!sectionId) return { allowed: true };

  const targetIdx = periodIndex(year, month);
  const todayIdx = periodIndex(todayYear, todayMonth);
  if (targetIdx <= todayIdx) return { allowed: true };

  const { data, error } = await supabase
    .from("academic_sections")
    .select("allow_advance_monthly_payment")
    .eq("id", sectionId)
    .maybeSingle();

  if (error || !data) {
    return { allowed: false, reason: "future_month_not_allowed" };
  }

  if (data.allow_advance_monthly_payment === true) {
    return { allowed: true };
  }

  return { allowed: false, reason: "future_month_not_allowed" };
}

/** Client-side check when section row already carries the flag. */
export function isAdvanceMonthlyPaymentAllowedForCell(
  allowAdvanceMonthlyPayment: boolean,
  cellYear: number,
  cellMonth: number,
  todayYear: number,
  todayMonth: number,
): boolean {
  const targetIdx = periodIndex(cellYear, cellMonth);
  const todayIdx = periodIndex(todayYear, todayMonth);
  if (targetIdx <= todayIdx) return true;
  return allowAdvanceMonthlyPayment;
}
