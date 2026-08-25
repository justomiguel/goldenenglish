import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getDictionary,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { resolvePublicBrand } from "@/lib/brand/resolvePublicBrand";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";
import { RegisterSurfaceByTemplate } from "@/components/organisms/RegisterSurfaceByTemplate";
import { loadRegistrationSectionOptions } from "@/lib/register/loadRegistrationSectionOptions";
import { applyLandingContentOverrides } from "@/lib/cms/applyLandingContentOverrides";
import { buildLandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { createLandingMediaPublicUrlBuilder } from "@/lib/cms/landingMediaPublicUrl";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({ params }: PageProps) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  if (!(await getInscriptionsEnabled())) {
    redirect(`/${locale}`);
  }

  const [baseDict, brand, snapshot, legalAgeMajority] = await Promise.all([
    getDictionary(locale),
    resolvePublicBrand(loc),
    loadActiveTheme(),
    getLegalAgeMajorityFromSystem(),
  ]);

  const templateKind = snapshot?.theme.templateKind ?? "classic";
  const dict = applyLandingContentOverrides(
    baseDict,
    snapshot?.theme.content,
    loc,
  );

  const sectionOptions = await loadRegistrationSectionOptions();

  const mediaMap: LandingMediaMap | undefined = snapshot
    ? buildLandingMediaMap(
        snapshot.media,
        createLandingMediaPublicUrlBuilder(),
      )
    : undefined;

  const shellProps = {
    locale,
    dict,
    brand,
    legalAgeMajority,
    sectionOptions,
  };

  return (
    <RegisterSurfaceByTemplate
      templateKind={templateKind}
      mediaMap={mediaMap}
      {...shellProps}
    />
  );
}
