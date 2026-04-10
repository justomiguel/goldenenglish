import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { getBrandPublic, type BrandPublic } from "@/lib/brand/server";
import { loadProperties, getProperty } from "@/lib/theme/themeParser";
import { taglineForLocale } from "@/lib/brand/taglineForLocale";

const brand: BrandPublic = getBrandPublic();

export const alt = brand.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const props = loadProperties();
  const primaryColor = getProperty(props, "color.primary", "#103A5C");
  const accentColor = getProperty(props, "color.accent", "#F0B932");
  const surfaceWhite = getProperty(props, "color.background", "#FFFFFF");
  const borderMuted = getProperty(props, "color.border", "#E5E7EB");
  const tagline = taglineForLocale(brand, locale);

  const logoPath = join(process.cwd(), "public", "images", "logo.png");
  const logoData = readFileSync(logoPath);
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

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
          background: `linear-gradient(135deg, ${primaryColor} 0%, #0A253D 100%)`,
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
            src={logoBase64}
            alt=""
            width={180}
            height={180}
            style={{ display: "flex" }}
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
