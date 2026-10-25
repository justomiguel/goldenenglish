import { createAnonClientFromCredentials } from "@/lib/supabase/anon";
import { readRequestSupabasePublicEnv } from "@/lib/supabase/requestPublicEnv";

/** Verifies credentials without touching the request cookie session. */
export async function verifyUserPassword(email: string, password: string): Promise<boolean> {
  const { url, anonKey } = await readRequestSupabasePublicEnv();
  if (!url || !anonKey) return false;
  const client = createAnonClientFromCredentials(url, anonKey);
  const { error } = await client.auth.signInWithPassword({ email, password });
  return !error;
}
