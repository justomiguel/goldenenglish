import type { Metadata } from "next";
import {
  locales,
  defaultLocale,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { notFound } from "next/navigation";
import { taglineForLocale } from "@/lib/brand/taglineForLocale";
import { resolvePublicBrandWithSetup } from "@/lib/brand/resolvePublicBrand";
import { JsonLdOrganization } from "@/components/molecules/JsonLdOrganization";
import { AnalyticsRoot } from "@/components/analytics/AnalyticsRoot";

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
  const { brand, needsInitialSiteSetup, dict } =
    await resolvePublicBrandWithSetup(loc);
  const description = needsInitialSiteSetup
    ? dict.greenfieldPublic.metaDescription
    : taglineForLocale(brand, locale);
  const path = `/${locale}`;

  const languageAlternates: Record<string, string> = {};
  for (const alt of locales) {
    languageAlternates[alt] = `/${alt}`;
  }
  languageAlternates["x-default"] = `/${defaultLocale}`;

  return {
    title: {
      default: brand.name,
      template: `%s | ${brand.name}`,
    },
    description,
    alternates: {
      canonical: path,
      languages: languageAlternates,
    },
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "es_AR",
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
  const { brand, needsInitialSiteSetup } = await resolvePublicBrandWithSetup(loc);

  return (
    <div lang={locale} className="min-h-screen">
      {needsInitialSiteSetup ? null : (
        <JsonLdOrganization locale={locale} brand={brand} />
      )}
      <AnalyticsRoot>{children}</AnalyticsRoot>
    </div>
  );
}
