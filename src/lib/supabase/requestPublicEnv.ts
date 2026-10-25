import "server-only";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";
import { isMultiTenantEnabled, tenantRegistryError } from "@/lib/tenant/tenantRegistry";

/** Anon URL and key for this request. Falls back to env for single-tenant and localhost. */
export async function readRequestSupabasePublicEnv(): Promise<{ url: string; anonKey: string }> {
  if (isMultiTenantEnabled()) {
    if (tenantRegistryError()) return { url: "", anonKey: "" };
    const tenant = await resolveRequestTenant();
    if (!tenant) return { url: "", anonKey: "" };
    return { url: tenant.supabaseUrl, anonKey: tenant.supabaseAnonKey };
  }
  return readSupabasePublicEnv();
}
