import type { SupabaseClient } from "@supabase/supabase-js";
import { parseInitialSiteSetupCompletedAt } from "@/lib/site/parseInitialSiteSetupRecord";
import { isInitialSiteSetupBypassed } from "@/lib/site/initialSiteSetupBypass";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

/**
 * When true, the admin must finish `/dashboard/admin/site-setup` before other admin routes.
 * Single-tenant CI: set SKIP_INITIAL_SITE_SETUP=1 to bypass.
 */
export async function loadNeedsInitialSiteSetup(
  supabase: SupabaseClient,
): Promise<boolean> {
  const tenant = getAlsTenant() ?? (await resolveRequestTenant());
  if (isInitialSiteSetupBypassed(tenant)) return false;

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "initial_site_setup")
    .maybeSingle();

  if (error || !data?.value) return true;

  const completed = parseInitialSiteSetupCompletedAt(data.value);
  return completed === null;
}
