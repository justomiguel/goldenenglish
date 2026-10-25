import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";
import { isMultiTenantEnabled, tenantRegistryError } from "@/lib/tenant/tenantRegistry";

/**
 * Service-role client. Never send this key to the browser.
 * In multi-tenant mode the key comes from the institute for this request.
 */
export function createAdminClientFromCredentials(
  url: string,
  serviceKey: string,
): SupabaseClient {
  if (!url.trim() || !serviceKey.trim()) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createAdminClient(): Promise<SupabaseClient> {
  const als = getAlsTenant();
  if (als) {
    return createAdminClientFromCredentials(als.supabaseUrl, als.supabaseServiceRoleKey);
  }
  if (isMultiTenantEnabled()) {
    if (tenantRegistryError()) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    const tenant = await resolveRequestTenant();
    if (!tenant) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    return createAdminClientFromCredentials(
      tenant.supabaseUrl,
      tenant.supabaseServiceRoleKey,
    );
  }
  const { url } = readSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey?.trim()) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createAdminClientFromCredentials(url, serviceKey);
}
