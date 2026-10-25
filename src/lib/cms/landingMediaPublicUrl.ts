import "server-only";

import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";
import { readRequestSupabasePublicEnv } from "@/lib/supabase/requestPublicEnv";
import { LANDING_MEDIA_BUCKET } from "@/lib/cms/landingMediaBucket";

export { LANDING_MEDIA_BUCKET };

function buildWithUrl(url: string): (storagePath: string) => string | null {
  const clean = url.trim();
  if (!clean) return () => null;
  const base = clean.replace(/\/+$/u, "");
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

/**
 * Builds a function that, given a storage object path inside the
 * `landing-media` bucket, returns its **public** URL. We assemble the URL
 * from the public Supabase env so the runtime layer can derive it without an
 * extra round-trip and without depending on the SDK at render time.
 *
 * Returns a builder that yields `null` when Supabase env is not configured
 * (local CI without DB) so the caller can treat overrides as absent.
 */
export function createLandingMediaPublicUrlBuilder(
  supabaseUrl?: string | null,
): (storagePath: string) => string | null {
  return buildWithUrl(supabaseUrl ?? readSupabasePublicEnv().url);
}

export async function createRequestLandingMediaPublicUrlBuilder(): Promise<
  (storagePath: string) => string | null
> {
  const { url } = await readRequestSupabasePublicEnv();
  return buildWithUrl(url);
}
