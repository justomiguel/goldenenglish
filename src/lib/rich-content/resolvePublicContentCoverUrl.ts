import { blogMediaPublicUrl } from "@/lib/blog/blogMedia";
import { extractFirstImageSrcFromHtml } from "@/lib/rich-content/extractFirstImageSrcFromHtml";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

/** Cover for blog cards / OG: explicit storage path wins, else first inline image. */
export function resolveBlogCoverImageUrl(
  bodyHtml: string,
  coverStoragePath: string | null | undefined,
): string | null {
  const path = coverStoragePath?.trim();
  if (path) {
    const { url } = readSupabasePublicEnv();
    if (url) return blogMediaPublicUrl(url, path);
  }
  return extractFirstImageSrcFromHtml(bodyHtml);
}

/** Cover for event cards / OG from localized description HTML. */
export function resolveEventCoverImageUrl(descriptionHtml: string): string | null {
  return extractFirstImageSrcFromHtml(descriptionHtml);
}
