import type { SupabaseClient } from "@supabase/supabase-js";

/** True when Flow Chile row exists with `enabled` (no secrets; uses SECURITY DEFINER RPC). */
export async function isFlowChileCheckoutEnabled(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_flow_chile_checkout_enabled");
  if (error || data == null) return false;
  return Boolean(data);
}
