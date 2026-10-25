import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createAdminClientFromCredentials } from "@/lib/supabase/admin";

export function readPulsarSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.PULSAR_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.PULSAR_SUPABASE_ANON_KEY?.trim() ?? "";
  return { url, anonKey };
}

export function isPulsarSupabaseConfigured(): boolean {
  const { url } = readPulsarSupabasePublicEnv();
  const serviceKey = process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  return url.length > 0 && serviceKey.length > 0;
}

export function createPulsarAdminClient(): SupabaseClient {
  const url = process.env.PULSAR_SUPABASE_URL?.trim() ?? "";
  const serviceKey = process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!url || !serviceKey) {
    throw new Error("Missing PULSAR_SUPABASE_URL or PULSAR_SUPABASE_SERVICE_ROLE_KEY");
  }
  return createAdminClientFromCredentials(url, serviceKey);
}

export async function createPulsarServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const { url, anonKey } = readPulsarSupabasePublicEnv();
  if (!url || !anonKey) {
    throw new Error("Missing PULSAR_SUPABASE_URL or PULSAR_SUPABASE_ANON_KEY");
  }
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component render — cookie mutation ignored.
        }
      },
    },
  });
}
