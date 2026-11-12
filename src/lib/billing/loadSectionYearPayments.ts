import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentRow } from "@/lib/billing/loadAdminSectionCollectionsViewQueries";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const PAGE_SIZE = 1000;
const COLUMNS =
  "id, student_id, section_id, month, year, amount, status, receipt_url, payment_method, paid_on";

/**
 * Every payment for one section and one calendar year.
 * PostgREST returns at most 1000 rows per response. Walk pages until the set ends.
 */
export async function loadSectionYearPayments(
  supabase: SupabaseClient,
  sectionId: string,
  year: number,
): Promise<PaymentRow[]> {
  const rows: PaymentRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("payments")
      .select(COLUMNS)
      .eq("section_id", sectionId)
      .eq("year", year)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      await logSupabaseClientError("loadSectionYearPayments", error, { sectionId, year, from });
      throw new Error("section_year_payments_failed");
    }
    const page = (data ?? []) as PaymentRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}
