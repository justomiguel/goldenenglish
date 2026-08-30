import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { resolvePublicBrandWithSetup } from "@/lib/brand/resolvePublicBrand";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { applyLandingContentOverrides } from "@/lib/cms/applyLandingContentOverrides";
import { PublicPrivacySurfaceByTemplate } from "@/components/organisms/PublicPrivacySurfaceByTemplate";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.privacy.metaTitle,
    description: dict.privacy.metaDescription,
    robots: { index: true, follow: true },
  };
}

export default async function PublicPrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  const [{ brand, needsInitialSiteSetup, dict: baseDict }, snapshot] = await Promise.all([
    resolvePublicBrandWithSetup(loc),
    loadActiveTheme(),
  ]);
  if (needsInitialSiteSetup) {
    redirect(`/${locale}`);
  }
  const dict = applyLandingContentOverrides(baseDict, snapshot?.theme.content, loc);
  return (
    <PublicPrivacySurfaceByTemplate
      templateKind={snapshot?.theme.templateKind ?? "classic"}
      locale={locale}
      dict={dict}
      brand={brand}
    />
  );
}
