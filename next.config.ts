import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import withSerwistInit from "@serwist/next";
import { readSupabasePublicEnv } from "./src/lib/supabase/publicEnv";

/** Vercel sets commit SHA in CI; local builds use a stable revision to avoid sw.js churn per commit. */
const swRevision = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || "local-dev";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/offline", revision: swRevision }],
  disable: process.env.NODE_ENV === "development",
});

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const { url: supabaseUrl, anonKey: supabaseAnonKey } = readSupabasePublicEnv();

let supabaseStorageHostname: string | null = null;
try {
  if (supabaseUrl) supabaseStorageHostname = new URL(supabaseUrl).hostname;
} catch {
  supabaseStorageHostname = null;
}

/**
 * Re-inline public Supabase vars so Edge proxy / Turbopack see them.
 * Values are loaded above from .env.local via loadEnvConfig.
 */
const nextConfig: NextConfig = {
  transpilePackages: [
    "@fullcalendar/core",
    "@fullcalendar/react",
    "@fullcalendar/daygrid",
    "@fullcalendar/timegrid",
    "@fullcalendar/list",
    "@fullcalendar/interaction",
  ],
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
    remotePatterns: supabaseStorageHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseStorageHostname,
            pathname: "/storage/v1/object/**",
          },
        ]
      : [],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "react-day-picker",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/extension-table",
      "@tiptap/pm",
    ],
    /** Allows profile avatar uploads up to `PROFILE_AVATAR_MAX_BYTES` via server actions. */
    serverActions: {
      bodySizeLimit: "16mb",
    },
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
            value: "camera=(self), microphone=(), geolocation=(), notifications=(self)",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:locale/dashboard/admin/import",
        destination: "/:locale/dashboard/admin/users/import",
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default withSerwist(nextConfig);
