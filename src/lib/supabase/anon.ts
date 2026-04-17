import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  hasSupabasePublicEnv,
  readSupabasePublicEnv,
} from "@/lib/supabase/publicEnv";

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
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
