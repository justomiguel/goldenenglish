import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
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
import { buildSectionEnrollmentLinkPath } from "@/lib/register/sectionEnrollmentLinkPath";
import { buildSectionEnrollmentLinkPageMetadata } from "@/lib/register/buildSectionEnrollmentLinkPageMetadata";
import { RegisterSurfaceByTemplate } from "@/components/organisms/RegisterSurfaceByTemplate";
import { SectionEnrollmentLinkUnavailable } from "@/components/register/SectionEnrollmentLinkUnavailable";

export async function sectionEnrollmentLinkGenerateMetadata(
  locale: string,
  token: string,
): Promise<Metadata> {
  const loc = locale as AppLocale;
  const [dict, brand, link] = await Promise.all([
    getDictionary(locale),
    resolvePublicBrand(loc),
    loadSectionEnrollmentLink(token),
  ]);
  return buildSectionEnrollmentLinkPageMetadata({
    locale,
    brandName: brand.name,
    weekdays: dict.register.sectionLink.weekdays,
    unavailableTitle: dict.register.sectionLink.unavailableTitle,
    link,
  });
}

export async function SectionEnrollmentLinkRoute({
  locale,
  token,
  incomingSlug,
}: {
  locale: string;
  token: string;
  incomingSlug?: string | null;
}) {
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

  if (link) {
    const canonical = buildSectionEnrollmentLinkPath(locale, link.sectionName, token);
    const current =
      incomingSlug == null || incomingSlug === ""
        ? `/${locale}/i/${token}`
        : `/${locale}/i/${incomingSlug}/${token}`;
    if (current !== canonical) permanentRedirect(canonical);
  }

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
