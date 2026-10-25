import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import withSerwistInit from "@serwist/next";
import { supabasePublicEnvInlinedForClient } from "./src/lib/supabase/clientBundleSupabaseEnv";
import { listTenants } from "./src/lib/tenant/tenantRegistry";

/**
 * Single-tenant public Supabase env for the client bundle.
 * Do not import `readSupabasePublicEnv` here: it pulls `@/lib/tenant/tenantAls`,
 * and the next.config transpiler does not resolve that alias.
 */
function readSingleTenantSupabasePublicEnv(): { url: string; anonKey: string } {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY?.trim() ||
    "";
  return { url, anonKey };
}

/** Vercel sets commit SHA in CI; local builds use a stable revision to avoid sw.js churn per commit. */
const swRevision = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || "local-dev";

/**
 * Isolate E2E `next build` / `next start` from tenant builds (same repo, parallel ports).
 * Playwright / `run-e2e-precommit.mjs` set `GE_DEV_TARGET=e2e`.
 */
const e2eIsolatedCache = (process.env.GE_DEV_TARGET ?? "").trim().toLowerCase() === "e2e";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/offline", revision: swRevision }],
  // E2E builds would rewrite the `public/sw.js` that precommit already staged.
  disable: process.env.NODE_ENV === "development" || e2eIsolatedCache,
});

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const configuredTenants = listTenants();
const rawEnv = readSingleTenantSupabasePublicEnv();
const inlinedSupabase = supabasePublicEnvInlinedForClient({
  tenantCount: configuredTenants.length,
  singleTenantUrl: rawEnv.url,
  singleTenantAnonKey: rawEnv.anonKey,
});

const storageHostnames = new Set<string>(["*.supabase.co"]);
const storageCandidates = [
  ...configuredTenants.map((t) => t.supabaseUrl),
  ...(configuredTenants.length === 0 ? [rawEnv.url] : []),
];
for (const candidate of storageCandidates) {
  try {
    if (candidate) storageHostnames.add(new URL(candidate).hostname);
  } catch {
    /* ignore malformed URL */
  }
}

/**
 * Single-tenant and E2E still inline public Supabase vars for Edge / Turbopack.
 * A shared deploy inlines empty strings so one institute is not baked into the bundle.
 */
const nextConfig: NextConfig = {
  ...(e2eIsolatedCache ? { distDir: ".next-e2e" } : {}),
  transpilePackages: [
    "@fullcalendar/core",
    "@fullcalendar/react",
    "@fullcalendar/daygrid",
    "@fullcalendar/timegrid",
    "@fullcalendar/list",
    "@fullcalendar/interaction",
  ],
  env: {
    NEXT_PUBLIC_SUPABASE_URL: inlinedSupabase.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: inlinedSupabase.anonKey,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "",
  },
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [...storageHostnames].map((hostname) => ({
      protocol: "https" as const,
      hostname,
      pathname: "/storage/v1/object/**",
    })),
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
