import type { SupabaseClient } from "@supabase/supabase-js";

export type MonthlyCheckoutBundleRow = {
  id: string;
  studentId: string;
  parentId: string | null;
  year: number;
  month: number;
  currency: string;
  expectedTotal: number;
  sectionIds: string[];
};

export async function loadMonthlyCheckoutBundle(
  admin: SupabaseClient,
  bundleId: string,
): Promise<MonthlyCheckoutBundleRow | null> {
  const { data, error } = await admin
    .from("payment_monthly_checkout_bundles")
    .select("id, student_id, parent_id, year, month, currency, expected_total, section_ids")
    .eq("id", bundleId)
    .maybeSingle();
  if (error || !data) return null;
  const sectionIds = Array.isArray(data.section_ids)
    ? (data.section_ids as unknown[]).filter((id): id is string => typeof id === "string")
    : [];
  if (sectionIds.length < 2) return null;
  return {
    id: String(data.id),
    studentId: String(data.student_id),
    parentId: typeof data.parent_id === "string" ? data.parent_id : null,
    year: Number(data.year),
    month: Number(data.month),
    currency: String(data.currency),
    expectedTotal: Number(data.expected_total),
    sectionIds,
  };
}
