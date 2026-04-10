import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import { readSupabasePublicEnv } from "./src/lib/supabase/publicEnv";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const { url: supabaseUrl, anonKey: supabaseAnonKey } = readSupabasePublicEnv();

/**
 * Re-inline public Supabase vars so Edge proxy / Turbopack see them.
 * Values are loaded above from .env.local via loadEnvConfig.
 */
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "",
  },
};

export default nextConfig;
