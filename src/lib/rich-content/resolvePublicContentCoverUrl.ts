import { blogMediaPublicUrl } from "@/lib/blog/blogMedia";
import { extractFirstImageSrcFromHtml } from "@/lib/rich-content/extractFirstImageSrcFromHtml";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

/** Cover for blog cards / OG / WhatsApp: first inline body image wins, else explicit storage path. */
export function resolveBlogCoverImageUrl(
  bodyHtml: string,
  coverStoragePath: string | null | undefined,
): string | null {
  const fromBody = extractFirstImageSrcFromHtml(bodyHtml);
  if (fromBody) return fromBody;

  const path = coverStoragePath?.trim();
  if (!path) return null;

  const { url } = readSupabasePublicEnv();
  if (!url) return null;
  return blogMediaPublicUrl(url, path);
}

/** Cover for event cards / OG from localized description HTML. */
export function resolveEventCoverImageUrl(descriptionHtml: string): string | null {
  return extractFirstImageSrcFromHtml(descriptionHtml);
}
