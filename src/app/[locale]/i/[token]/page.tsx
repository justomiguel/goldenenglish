import type { Metadata } from "next";
import {
  getDictionary,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { resolvePublicBrand } from "@/lib/brand/resolvePublicBrand";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { applyLandingContentOverrides } from "@/lib/cms/applyLandingContentOverrides";
import { buildLandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { createLandingMediaPublicUrlBuilder } from "@/lib/cms/landingMediaPublicUrl";
import { loadSectionEnrollmentLink } from "@/lib/register/loadSectionEnrollmentLink";
import { loadRegistrationSectionOptions } from "@/lib/register/loadRegistrationSectionOptions";
import { RegisterSurfaceByTemplate } from "@/components/organisms/RegisterSurfaceByTemplate";
import { SectionEnrollmentLinkUnavailable } from "@/components/register/SectionEnrollmentLinkUnavailable";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

export default async function SectionEnrollmentLinkPage({ params }: PageProps) {
  const { locale, token } = await params;
  const loc = locale as AppLocale;

  const [baseDict, brand, snapshot, legalAgeMajority, link, sectionOptions] =
    await Promise.all([
      getDictionary(locale),
      resolvePublicBrand(loc),
      loadActiveTheme(),
      getLegalAgeMajorityFromSystem(),
      loadSectionEnrollmentLink(token),
      loadRegistrationSectionOptions(),
    ]);

  const dict = applyLandingContentOverrides(baseDict, snapshot?.theme.content, loc);

  if (!link) {
    return (
      <SectionEnrollmentLinkUnavailable
        locale={locale}
        labels={dict.register.sectionLink}
      />
    );
  }

  const mediaMap: LandingMediaMap | undefined = snapshot
    ? buildLandingMediaMap(snapshot.media, createLandingMediaPublicUrlBuilder())
    : undefined;

  return (
    <RegisterSurfaceByTemplate
      templateKind={snapshot?.theme.templateKind ?? "classic"}
      mediaMap={mediaMap}
      locale={locale}
      dict={dict}
      brand={brand}
      legalAgeMajority={legalAgeMajority}
      sectionOptions={sectionOptions}
      enrollmentLink={link}
    />
  );
}
