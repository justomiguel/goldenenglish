import type { SupabaseClient } from "@supabase/supabase-js";
import { parseInitialSiteSetupCompletedAt } from "@/lib/site/parseInitialSiteSetupRecord";

/**
 * When true, the admin must finish `/dashboard/admin/site-setup` before other admin routes.
 * CI/local: set SKIP_INITIAL_SITE_SETUP=1 to bypass.
 */
export async function loadNeedsInitialSiteSetup(
  supabase: SupabaseClient,
): Promise<boolean> {
  if (process.env.SKIP_INITIAL_SITE_SETUP === "1") return false;

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "initial_site_setup")
    .maybeSingle();

  if (error || !data?.value) return true;

  const completed = parseInitialSiteSetupCompletedAt(data.value);
  return completed === null;
}
