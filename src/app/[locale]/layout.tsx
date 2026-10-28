import type { Metadata } from "next";
import {
  locales,
  defaultLocale,
  getDictionary,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { notFound } from "next/navigation";
import { buildRootLayoutIcons } from "@/lib/brand/buildRootLayoutIcons";
import { taglineForLocale } from "@/lib/brand/taglineForLocale";
import { resolvePublicBrandWithSetup } from "@/lib/brand/resolvePublicBrand";
import { JsonLdOrganization } from "@/components/molecules/JsonLdOrganization";
import { AnalyticsRoot } from "@/components/analytics/AnalyticsRoot";
import { PwaInstallPromptHost } from "@/components/molecules/PwaInstallPromptHost";
import { sharePreviewBundleKeyFromTemplateKind } from "@/lib/landing/sharePreviewBundleKey";
import { openGraphLocaleForInstitute } from "@/lib/metadata/buildHomePageMetadata";
import { lioraPlacesFromSedes } from "@/lib/public/instituteAnswerPages";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";
import { centrolistoLayoutIcons } from "@/lib/pulsar/centrolistoFavicon";
import { centrolistoShareMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { CentroListoJsonLd } from "@/components/organisms/pulsar/CentroListoJsonLd";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale as AppLocale;
  if (await isPulsarPlatformRequest()) {
    const dict = await getDictionary(loc);
    const share = await centrolistoShareMetadata({
      title: dict.pulsar.meta.brandName,
      description: dict.pulsar.meta.brandTagline,
      siteName: dict.pulsar.meta.brandName,
      locale: loc,
    });
    return {
      title: {
        default: dict.pulsar.meta.brandName,
        template: `%s | ${dict.pulsar.meta.brandName}`,
      },
      description: dict.pulsar.meta.description,
      icons: centrolistoLayoutIcons(),
      ...share,
    };
  }
  const { brand, needsInitialSiteSetup, dict } =
    await resolvePublicBrandWithSetup(loc);
  const taglinePart = needsInitialSiteSetup
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
  const description =
    needsInitialSiteSetup
      ? taglinePart
      : shareContext
        ? `${taglinePart} — ${shareContext}`
        : taglinePart;
  const path = `/${locale}`;

  const languageAlternates: Record<string, string> = {};
  for (const alt of locales) {
    languageAlternates[alt] = `/${alt}`;
  }
  languageAlternates["x-default"] = `/${defaultLocale}`;

  return {
    // Keep template so child pages inherit the format; omit default so the root
    // layout's default is used as-is for pages that set no title of their own,
    // preventing the "<brand> | <brand>" doubling. The TypeScript TemplateString
    // type requires default or absolute, but Next.js runtime supports template-only.
    title: { template: `%s | ${brand.name}` } as Metadata["title"],
    description,
    ...(needsInitialSiteSetup ? { icons: buildRootLayoutIcons(brand) } : {}),
    alternates: {
      canonical: path,
      languages: languageAlternates,
    },
    openGraph: {
      type: "website",
      locale: openGraphLocaleForInstitute(activeTheme?.theme.templateKind, locale),
      url: path,
      siteName: brand.name,
      title: brand.name,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: brand.name,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as AppLocale)) {
    notFound();
  }

  const loc = locale as AppLocale;
  if (await isPulsarPlatformRequest()) {
    const dict = await getDictionary(loc);
    const origin = (await getRequestPublicSiteUrl())?.origin ?? "https://centrolisto.cl";
    return (
      <div className="min-h-screen">
        <CentroListoJsonLd
          name={dict.pulsar.meta.brandName}
          description={dict.pulsar.meta.description}
          url={`${origin}/${loc}`}
          logoUrl={`${origin}/centrolisto/android-chrome-512x512.png`}
        />
        {children}
      </div>
    );
  }
  const { brand, needsInitialSiteSetup, dict } =
    await resolvePublicBrandWithSetup(loc);
  const siteOrigin = (await getRequestPublicSiteUrl())?.origin ?? null;
  const activeTheme = needsInitialSiteSetup ? null : await loadActiveTheme();
  const templateKind = activeTheme?.theme.templateKind ?? "classic";
  const places =
    templateKind === "liora" ? lioraPlacesFromSedes(dict.landing.liora.sedes) : [];

  return (
    <div className="min-h-screen">
      {needsInitialSiteSetup ? null : (
        <JsonLdOrganization
          locale={locale}
          brand={brand}
          siteOrigin={siteOrigin}
          templateKind={templateKind}
          places={places}
        />
      )}
      <AnalyticsRoot>{children}</AnalyticsRoot>
      {needsInitialSiteSetup ? null : (
        <PwaInstallPromptHost copy={dict.pwa.install} />
      )}
    </div>
  );
}
