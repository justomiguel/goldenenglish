import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Financial UX: minors are billed via linked guardian; adults manage their own invoices.
 * Uses `profiles.is_minor` (maintained by DB trigger from birth_date).
 */
export async function getFinancialBillingContext(
  supabase: SupabaseClient,
  studentId: string,
): Promise<{ managesSelf: boolean }> {
  const { data } = await supabase
    .from("profiles")
    .select("is_minor")
    .eq("id", studentId)
    .maybeSingle();

  const minor = Boolean((data as { is_minor?: boolean } | null)?.is_minor);
  return { managesSelf: !minor };
}
