import { createClient } from "@supabase/supabase-js";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

/** Verifies credentials without touching the request cookie session. */
export async function verifyUserPassword(email: string, password: string): Promise<boolean> {
  const { url, anonKey } = readSupabasePublicEnv();
  if (!url || !anonKey) return false;
  const client = createClient(url, anonKey);
  const { error } = await client.auth.signInWithPassword({ email, password });
  return !error;
}
