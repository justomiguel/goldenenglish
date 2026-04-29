import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

const BUCKET = "badge-images" as const;

/**
 * Build the public URL for a `badge-images` storage object path.
 * Returns `null` when the input is invalid or the env is missing.
 * Avoids a runtime Supabase call (URL is deterministic for a public bucket).
 */
export function badgeImagePublicUrl(path: string | null | undefined): string | null {
  if (typeof path !== "string") return null;
  const trimmed = path.trim();
  if (trimmed.length === 0) return null;
  let envUrl: string;
  try {
    envUrl = readSupabasePublicEnv().url;
  } catch {
    return null;
  }
  if (!envUrl) return null;
  const base = envUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${encodePath(trimmed)}`;
}

function encodePath(p: string): string {
  return p
    .split("/")
    .filter((seg) => seg.length > 0)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}
