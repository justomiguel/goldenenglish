import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import type { BlogLocale } from "@/lib/blog/domain";
import { loadBlogArticleShareCover } from "@/lib/blog/server/loadBlogArticleShareCover";
import { getBrandForRequest } from "@/lib/brand/server";
import { resolveBrandLogoAbsoluteUrl } from "@/lib/brand/resolveBrandLogoUrl";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";
import { getProperty } from "@/lib/theme/themeParser";

export const alt = "Blog article preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

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
  const heroImage = share?.coverImageUrl ?? fallbackLogo;
  const title = share?.title ?? brand.name;
  const { properties } = await loadEffectiveProperties();
  const primaryColor = getProperty(properties, "color.primary", "#103A5C");
  const primaryDark = getProperty(properties, "color.primary.dark", "#0A253D");

  if (share?.coverImageUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
          }}
        >
          <img
            src={heroImage}
            alt=""
            width={1200}
            height={630}
            style={{
              display: "flex",
              objectFit: "cover",
              width: "100%",
              height: "100%",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "36px 48px",
              background: "linear-gradient(transparent, rgba(0,0,0,0.82))",
              display: "flex",
            }}
          >
            <div
              style={{
                fontSize: 44,
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.15,
                display: "flex",
              }}
            >
              {title}
            </div>
          </div>
        </div>
      ),
      { ...size },
    );
  }

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
