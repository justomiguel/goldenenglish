import type { SupabaseClient } from "@supabase/supabase-js";

const SIGNED_SECONDS = 60 * 60;

/**
 * Resolves profile.avatar_url for display: https URLs pass through;
 * otherwise treats value as a path in the private `avatars` bucket and returns a signed URL.
 */
export async function resolveAvatarDisplayUrl(
  supabase: SupabaseClient,
  avatarUrl: string | null | undefined,
): Promise<string | null> {
  const raw = avatarUrl?.trim();
  if (!raw) return null;
  if (raw.startsWith("https://") || raw.startsWith("http://")) {
    return raw;
  }
  const path = raw.replace(/^\/+/, "");
  if (!path || path.includes("..")) return null;
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, SIGNED_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function resolveAvatarUrlForAdmin(
  admin: SupabaseClient,
  avatarUrl: string | null | undefined,
): Promise<string | null> {
  return resolveAvatarDisplayUrl(admin, avatarUrl);
}
