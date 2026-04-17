import "server-only";

import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

/** Bucket name used by the landing CMS for image overrides (matches the
 *  migration `046_site_themes.sql`). */
export const LANDING_MEDIA_BUCKET = "landing-media";

/**
 * Builds a function that, given a storage object path inside the
 * `landing-media` bucket, returns its **public** URL. We assemble the URL
 * from the public Supabase env so the runtime layer can derive it without an
 * extra round-trip and without depending on the SDK at render time.
 *
 * Returns a builder that yields `null` when Supabase env is not configured
 * (local CI without DB) so the caller can treat overrides as absent.
 */
export function createLandingMediaPublicUrlBuilder(): (
  storagePath: string,
) => string | null {
  const { url } = readSupabasePublicEnv();
  if (!url) return () => null;
  const base = url.replace(/\/+$/u, "");
  return (storagePath: string) => {
    const trimmed = storagePath.replace(/^\/+/u, "");
    if (!trimmed) return null;
    const encoded = trimmed
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    return `${base}/storage/v1/object/public/${LANDING_MEDIA_BUCKET}/${encoded}`;
  };
}
