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
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
