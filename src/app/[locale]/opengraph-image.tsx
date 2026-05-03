import { ImageResponse } from "next/og";
import {
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { resolvePublicBrandWithSetup } from "@/lib/brand/resolvePublicBrand";
import { getProperty } from "@/lib/theme/themeParser";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";
import { taglineForLocale } from "@/lib/brand/taglineForLocale";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { sharePreviewBundleKeyFromTemplateKind } from "@/lib/landing/sharePreviewBundleKey";
import { resolveSharePreviewLogoAbsoluteUrl } from "@/lib/landing/resolveSharePreviewLogoUrl";

export const alt = "Open Graph image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  const { brand, needsInitialSiteSetup, dict } =
    await resolvePublicBrandWithSetup(loc);
  const { properties } = await loadEffectiveProperties();
  const primaryColor = getProperty(properties, "color.primary", "#103A5C");
  const primaryDark = getProperty(properties, "color.primary.dark", "#0A253D");
  const accentColor = getProperty(properties, "color.accent", "#F0B932");
  const surfaceWhite = getProperty(properties, "color.background", "#FFFFFF");
  const borderMuted = getProperty(properties, "color.border", "#E5E7EB");
  const tagline = needsInitialSiteSetup
    ? dict.greenfieldPublic.metaDescription
    : taglineForLocale(brand, locale);

  const activeTheme = needsInitialSiteSetup
    ? null
    : await loadActiveTheme();
  const shareBundleKey = sharePreviewBundleKeyFromTemplateKind(
    activeTheme?.theme.templateKind,
  );
  const shareContext =
    dict.socialShare.byKind[shareBundleKey]?.shareContext ?? null;

  const origin =
    getPublicSiteUrl()?.origin.replace(/\/$/, "") ?? "http://localhost:3000";
  const logoSrc = await resolveSharePreviewLogoAbsoluteUrl(
    origin,
    shareBundleKey,
    brand,
  );

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
            height: "6px",
            background: accentColor,
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: surfaceWhite,
            padding: "24px 28px",
            borderRadius: "24px",
            marginBottom: "32px",
            border: `2px solid ${borderMuted}`,
          }}
        >
          <img
            src={logoSrc}
            alt=""
            width={180}
            height={180}
            style={{ display: "flex", objectFit: "contain" }}
          />
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "-1px",
            marginBottom: "16px",
            display: "flex",
          }}
        >
          {brand.name}
        </div>

        <div
          style={{
            fontSize: 24,
            color: accentColor,
            maxWidth: "800px",
            textAlign: "center",
            lineHeight: 1.4,
            display: "flex",
          }}
        >
          {tagline}
        </div>

        {shareContext ? (
          <div
            style={{
              marginTop: "20px",
              fontSize: 22,
              color: "rgba(255, 255, 255, 0.92)",
              maxWidth: "920px",
              textAlign: "center",
              lineHeight: 1.45,
              display: "flex",
            }}
          >
            {shareContext}
          </div>
        ) : null}

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: accentColor,
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
