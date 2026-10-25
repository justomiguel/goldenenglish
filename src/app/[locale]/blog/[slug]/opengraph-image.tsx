import { createClient } from "@/lib/supabase/server";
import type { BlogLocale } from "@/lib/blog/domain";
import { loadBlogArticleShareCover } from "@/lib/blog/server/loadBlogArticleShareCover";
import { getBrandForRequest } from "@/lib/brand/server";
import { resolveBrandLogoAbsoluteUrl } from "@/lib/brand/resolveBrandLogoUrl";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";
import { optimizeRemoteImageForShare } from "@/lib/rich-content/optimizeRemoteImageForShare";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import { loadHomeSharePhotoUrl } from "@/lib/site/buildResolvedPublicShareMetadata";

export const alt = "Blog article preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";
export const dynamic = "force-dynamic";

const OG_CACHE_CONTROL = "private, no-store";

export default async function BlogArticleOpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const supabase = await createClient();
  const share = await loadBlogArticleShareCover(
    supabase,
    locale as BlogLocale,
    slug,
  );
  const brand = await getBrandForRequest();
  const origin = (await getRequestPublicSiteUrl())?.origin.replace(/\/$/, "") ?? "http://localhost:3000";
  const fallbackLogo = resolveBrandLogoAbsoluteUrl(brand, origin);

  if (share?.coverImageUrl) {
    try {
      const optimized = await optimizeRemoteImageForShare(share.coverImageUrl);
      return new Response(new Uint8Array(optimized.buffer), {
        headers: {
          "Content-Type": optimized.contentType,
          "Cache-Control": OG_CACHE_CONTROL,
        },
      });
    } catch (error) {
      logServerWarn("blog.opengraph-image.optimize", {
        slug,
        locale,
        reason: "cover_optimize_failed",
        error,
      });
    }
  }

  const homePhoto = await loadHomeSharePhotoUrl();
  const photoUrl = homePhoto ?? fallbackLogo;
  try {
    const optimized = await optimizeRemoteImageForShare(photoUrl);
    return new Response(new Uint8Array(optimized.buffer), {
      headers: {
        "Content-Type": optimized.contentType,
        "Cache-Control": OG_CACHE_CONTROL,
      },
    });
  } catch (error) {
    logServerWarn("blog.opengraph-image.fallback", {
      slug,
      locale,
      reason: "fallback_image_failed",
      error,
    });
  }

  return new Response(null, { status: 404 });
}
