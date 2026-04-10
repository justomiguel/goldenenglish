"use client";

import { createBrowserClient } from "@supabase/ssr";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

export function createClient() {
  const { url, anonKey } = readSupabasePublicEnv();
  return createBrowserClient(url, anonKey);
}
