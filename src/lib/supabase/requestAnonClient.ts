import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createAnonReadOnlyClient } from "@/lib/supabase/anon";
import { readRequestSupabasePublicEnv } from "@/lib/supabase/requestPublicEnv";
import { isMultiTenantEnabled, tenantRegistryError } from "@/lib/tenant/tenantRegistry";

/** Anon client for the institute on this request. Single-tenant uses the env client. */
export async function createRequestAnonClient(): Promise<SupabaseClient | null> {
  if (!isMultiTenantEnabled() || tenantRegistryError()) {
    return createAnonReadOnlyClient();
  }
  const { url, anonKey } = await readRequestSupabasePublicEnv();
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
