import type { Metadata } from "next";
import {
  locales,
  defaultLocale,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { notFound } from "next/navigation";
import { getBrandPublic } from "@/lib/brand/server";
import { taglineForLocale } from "@/lib/brand/taglineForLocale";
import { JsonLdOrganization } from "@/components/molecules/JsonLdOrganization";

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
  const brand = getBrandPublic();
  const description = taglineForLocale(brand, locale);
  const path = `/${locale}`;

  const languageAlternates: Record<string, string> = {};
  for (const loc of locales) {
    languageAlternates[loc] = `/${loc}`;
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
      images: [
        {
          url: brand.logoPath,
          alt: brand.logoAlt || brand.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: brand.name,
      description,
      images: [brand.logoPath],
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

  return (
    <div lang={locale} className="min-h-screen">
      <JsonLdOrganization locale={locale} />
      {children}
    </div>
  );
}
