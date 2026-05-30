import type { SupabaseClient } from "@supabase/supabase-js";

export async function loadFinanceHubPendingCounts(supabase: SupabaseClient) {
  const [
    { count: monthlyPayments },
    { count: enrollmentFeeReceipts },
    { count: invoiceReceipts },
    { count: eventPending },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending"),
    supabase
      .from("section_enrollments")
      .select("id", { head: true, count: "exact" })
      .eq("enrollment_fee_receipt_status", "pending"),
    supabase
      .from("billing_receipts")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending_approval"),
    supabase
      .from("event_payments")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending"),
  ]);
  return {
    payments:
      (monthlyPayments ?? 0) +
      (enrollmentFeeReceipts ?? 0) +
      (invoiceReceipts ?? 0),
    receipts: eventPending ?? 0,
  };
}

interface CohortLite {
  id: string;
  name: string;
  is_current: boolean | null;
  archived_at: string | null;
}

export function pickFinanceHubCohort(
  cohorts: CohortLite[],
  requestedId: string | undefined,
): CohortLite | null {
  if (cohorts.length === 0) return null;
  if (requestedId) {
    const match = cohorts.find((c) => c.id === requestedId);
    if (match) return match;
  }
  const current = cohorts.find((c) => c.is_current);
  if (current) return current;
  return cohorts.find((c) => c.archived_at == null) ?? cohorts[0]!;
}

export function parseFinanceHubYear(input: string | undefined, fallback: number): number {
  if (!input) return fallback;
  const n = Number.parseInt(input, 10);
  if (!Number.isFinite(n) || n < 2000 || n > 2100) return fallback;
  return n;
}
