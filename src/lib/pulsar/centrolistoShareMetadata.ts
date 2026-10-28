import type { Metadata } from "next";
import { defaultLocale, locales } from "@/lib/i18n/dictionaries";
import { buildLocalePageAlternates } from "@/lib/metadata/buildHomePageMetadata";
import { absoluteUrlForRequest } from "@/lib/site/requestPublicUrl";

export const CENTROLISTO_OG_IMAGE_PATH = "/centrolisto/og.png";

function openGraphLocale(locale: string): string {
  if (locale === "en") return "en_US";
  if (locale === "pt") return "pt_BR";
  return "es_419";
}

function homeAlternates(locale: string): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const loc of locales) languages[loc] = `/${loc}`;
  languages["x-default"] = `/${defaultLocale}`;
  return { canonical: `/${locale}`, languages };
}

/** Open Graph and Twitter card for a Centro Listo page. The image is language-neutral. */
export async function centrolistoShareMetadata(input: {
  title: string;
  description: string;
  siteName: string;
  locale: string;
  /** Path after the locale. Empty string is the home page. */
  suffix?: string;
}): Promise<Pick<Metadata, "openGraph" | "twitter" | "alternates">> {
  const suffix = input.suffix ?? "";
  const path = `/${input.locale}${suffix}`;
  const pageUrl = (await absoluteUrlForRequest(path))?.toString() ?? path;
  const imageUrl =
    (await absoluteUrlForRequest(CENTROLISTO_OG_IMAGE_PATH))?.toString() ??
    CENTROLISTO_OG_IMAGE_PATH;

  return {
    alternates: suffix ? buildLocalePageAlternates(input.locale, suffix) : homeAlternates(input.locale),
    openGraph: {
      type: "website",
      locale: openGraphLocale(input.locale),
      url: pageUrl,
      siteName: input.siteName,
      title: input.title,
      description: input.description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: input.siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [imageUrl],
    },
  };
}
