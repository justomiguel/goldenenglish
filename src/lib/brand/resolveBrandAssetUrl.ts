import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

/** Must match `046_site_themes.sql` / `landingMediaPublicUrl.ts`. */
export const BRAND_ASSETS_BUCKET = "landing-media";

/**
 * Logo/favicon paths from theme overrides may be:
 * - absolute `https://…` (CDN / legacy full URL),
 * - site-relative `/images/…` or `/favicon_io/…` (bundled `public/`),
 * - **storage object key** without leading slash (e.g. `<uuid>/migration/images/logo.png`)
 *   resolved via `NEXT_PUBLIC_SUPABASE_URL` for multi-site / Storage-hosted assets.
 *
 * When Supabase URL is missing (CI without env), returns `fallback`.
 */
export function resolveBrandAssetUrl(raw: string, fallback: string): string {
  const v = raw.trim();
  if (!v) return fallback;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("/")) return v;
  const { url } = readSupabasePublicEnv();
  if (!url) return fallback;
  const base = url.replace(/\/+$/u, "");
  const encoded = v
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/storage/v1/object/public/${BRAND_ASSETS_BUCKET}/${encoded}`;
}
