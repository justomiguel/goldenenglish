import type { SupabaseClient } from "@supabase/supabase-js";

const ISO_4217_RE = /^[A-Z]{3}$/;

export interface UpdateBillingCurrencyResult {
  ok: boolean;
  error?: string;
}

/**
 * Update the system-wide billing currency in site_settings.
 * Requires admin client (service_role or authenticated admin).
 */
export async function updateBillingCurrencySetting(
  supabase: SupabaseClient,
  currency: string,
): Promise<UpdateBillingCurrencyResult> {
  const normalized = currency.trim().toUpperCase();

  if (!ISO_4217_RE.test(normalized)) {
    return { ok: false, error: "invalid_currency" };
  }

  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { key: "billing_currency", value: normalized, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );

  if (error) {
    return { ok: false, error: "db_error" };
  }

  return { ok: true };
}
