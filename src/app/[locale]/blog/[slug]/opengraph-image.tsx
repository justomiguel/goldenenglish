import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import type { BlogLocale } from "@/lib/blog/domain";
import { loadBlogArticleShareCover } from "@/lib/blog/server/loadBlogArticleShareCover";
import { getBrandForRequest } from "@/lib/brand/server";
import { resolveBrandLogoAbsoluteUrl } from "@/lib/brand/resolveBrandLogoUrl";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";
import { getProperty } from "@/lib/theme/themeParser";
import { optimizeRemoteImageForShare } from "@/lib/rich-content/optimizeRemoteImageForShare";
import { logServerWarn } from "@/lib/logging/serverActionLog";

export const alt = "Blog article preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";
export const revalidate = 3600;

const OG_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

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
  const origin =
    getPublicSiteUrl()?.origin.replace(/\/$/, "") ?? "http://localhost:3000";
  const fallbackLogo = resolveBrandLogoAbsoluteUrl(brand, origin);
  const title = share?.title ?? brand.name;

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

  const { properties } = await loadEffectiveProperties();
  const primaryColor = getProperty(properties, "color.primary", "#103A5C");
  const primaryDark = getProperty(properties, "color.primary.dark", "#0A253D");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
          padding: "48px",
        }}
      >
        <img
          src={fallbackLogo}
          alt=""
          width={160}
          height={160}
          style={{ display: "flex", objectFit: "contain", marginBottom: 32 }}
        />
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: "#FFFFFF",
            textAlign: "center",
            lineHeight: 1.2,
            display: "flex",
          }}
        >
          {title}
        </div>
      </div>
    ),
    { ...size },
  );
}
