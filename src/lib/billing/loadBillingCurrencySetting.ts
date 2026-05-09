import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_BILLING_CURRENCY = "USD";
const ISO_4217_RE = /^[A-Z]{3}$/;

export interface BillingCurrencySetting {
  currency: string;
}

function normalizeCurrency(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_BILLING_CURRENCY;
  const upper = raw.trim().toUpperCase();
  return ISO_4217_RE.test(upper) ? upper : DEFAULT_BILLING_CURRENCY;
}

/**
 * Load the system-wide billing currency from site_settings.
 * Falls back to USD if not set or invalid.
 */
export async function loadBillingCurrencySetting(
  supabase: SupabaseClient,
): Promise<BillingCurrencySetting> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "billing_currency")
    .maybeSingle();

  if (!data?.value) {
    return { currency: DEFAULT_BILLING_CURRENCY };
  }

  const raw = typeof data.value === "string" ? data.value : (data.value as string);
  return { currency: normalizeCurrency(raw) };
}

export { DEFAULT_BILLING_CURRENCY };
