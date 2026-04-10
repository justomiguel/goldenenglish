import { createClient } from "@supabase/supabase-js";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

/**
 * Solo servidor. Requiere SUPABASE_SERVICE_ROLE_KEY (nunca exponer al cliente).
 */
export function createAdminClient() {
  const { url } = readSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey?.trim()) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
