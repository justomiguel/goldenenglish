import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function insertMonthlyCheckoutBundle(
  admin: SupabaseClient,
  input: {
    studentId: string;
    parentId: string | null;
    year: number;
    month: number;
    currency: string;
    expectedTotal: number;
    sectionIds: string[];
  },
): Promise<{ ok: true; bundleId: string } | { ok: false }> {
  const { data, error } = await admin
    .from("payment_monthly_checkout_bundles")
    .insert({
      student_id: input.studentId,
      parent_id: input.parentId,
      year: input.year,
      month: input.month,
      currency: input.currency,
      expected_total: input.expectedTotal,
      section_ids: input.sectionIds,
    })
    .select("id")
    .single();

  if (error || typeof data?.id !== "string") {
    logSupabaseClientError("insertMonthlyCheckoutBundle", error ?? {}, {
      student_id: input.studentId,
    });
    return { ok: false };
  }
  return { ok: true, bundleId: data.id };
}
