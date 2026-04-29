import { ImageResponse } from "next/og";
import { getBrandForRequest } from "@/lib/brand/server";
import { resolveBrandLogoAbsoluteUrl } from "@/lib/brand/resolveBrandLogoUrl";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";
import { getProperty } from "@/lib/theme/themeParser";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadPublicStudentBadgeShareByToken } from "@/lib/badges/loadPublicStudentBadgeShare";
import { loadPublicBadgeCatalogEntryByCode } from "@/lib/badges/loadPublicBadgeCatalogEntry";
import { resolveBadgeTranslation } from "@/lib/badges/badgeCatalog";
import { badgeImagePublicUrl } from "@/lib/badges/badgeImagePublicUrl";
import { isStudentBadgeCode } from "@/lib/badges/badgeCodes";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

export const alt = "Open Graph image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
/** ISR: data per token is stable; revalidate daily and let CDN cache OG image. */
export const revalidate = 86400;

export default async function StudentBadgeShareOgImage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const data = await loadPublicStudentBadgeShareByToken(token);
  const dict = await getDictionary(locale);
  const { properties } = await loadEffectiveProperties();
  const primaryColor = getProperty(properties, "color.primary", "#103A5C");
  const primaryDark = getProperty(properties, "color.primary.dark", "#0A253D");
  const accentColor = getProperty(properties, "color.accent", "#F0B932");
  const surfaceWhite = getProperty(properties, "color.background", "#FFFFFF");
  const borderMuted = getProperty(properties, "color.border", "#E5E7EB");

  const origin =
    getPublicSiteUrl()?.origin.replace(/\/$/, "") ?? "http://localhost:3000";

  const brand = await getBrandForRequest();
  const fallbackLogoUrl = resolveBrandLogoAbsoluteUrl(brand, origin);

  const validCode = data && isStudentBadgeCode(data.badgeCode);
  const catalog = validCode ? await loadPublicBadgeCatalogEntryByCode(data.badgeCode) : null;
  const customImageUrl = catalog ? badgeImagePublicUrl(catalog.imagePath) : null;
  const heroImage = customImageUrl ?? fallbackLogoUrl;

  const title = catalog
    ? resolveBadgeTranslation({ code: catalog.code, translations: catalog.translations }, locale).title
    : validCode
      ? (() => {
          const def = dict.dashboard.student.badges.definitions[
            data.badgeCode as keyof typeof dict.dashboard.student.badges.definitions
          ] as { title: string } | undefined;
          return def?.title ?? data.badgeCode;
        })()
      : dict.publicStudentBadge.title;

  const d = data?.earnedAt ? new Date(data.earnedAt) : null;
  const when =
    d && !Number.isNaN(d.getTime())
      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d)
      : "";

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
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: accentColor,
            display: "flex",
          }}
        />
        {heroImage ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: surfaceWhite,
              padding: "20px 24px",
              borderRadius: 20,
              marginBottom: 24,
              border: `2px solid ${borderMuted}`,
            }}
          >
            <img src={heroImage} alt="" width={160} height={160} style={{ display: "flex", objectFit: "contain" }} />
          </div>
        ) : null}
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: "#FFFFFF",
            textAlign: "center",
            maxWidth: 1000,
            lineHeight: 1.2,
            display: "flex",
            padding: "0 32px",
          }}
        >
          {title}
        </div>
        {when ? (
          <div
            style={{
              fontSize: 22,
              color: accentColor,
              marginTop: 16,
              display: "flex",
            }}
          >
            {dict.publicStudentBadge.earnedOn.replace("{date}", when)}
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 26,
            color: "rgba(255,255,255,0.9)",
            display: "flex",
          }}
        >
          {brand.name}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: accentColor,
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
