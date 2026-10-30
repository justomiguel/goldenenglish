import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { bindInstituteDataPlane } from "@/lib/supabase/bindInstituteDataPlane";
import {
  hasSupabasePublicEnv,
  readSupabasePublicEnv,
} from "@/lib/supabase/publicEnv";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";

/**
 * Cookieless / read-only client suitable for `unstable_cache`-wrapped reads
 * that should be identical for every visitor (no session, no refresh).
 *
 * Returns `null` when the public Supabase env is not configured (e.g. local CI
 * without DB) so callers can degrade gracefully without throwing.
 */
export function createAnonReadOnlyClient(): SupabaseClient | null {
  if (!hasSupabasePublicEnv()) return null;
  const { url, anonKey } = readSupabasePublicEnv();
  return bindInstituteDataPlane(createAnonClientFromCredentials(url, anonKey), getAlsTenant());
}

export function createAnonClientFromCredentials(
  url: string,
  anonKey: string,
): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
