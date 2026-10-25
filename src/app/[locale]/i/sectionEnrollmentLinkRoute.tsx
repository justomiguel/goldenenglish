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
import { createRequestLandingMediaPublicUrlBuilder } from "@/lib/cms/landingMediaPublicUrl";
import { loadSectionEnrollmentLink } from "@/lib/register/loadSectionEnrollmentLink";
import { loadRegistrationSectionOptions } from "@/lib/register/loadRegistrationSectionOptions";
import { buildSectionEnrollmentLinkPath } from "@/lib/register/sectionEnrollmentLinkPath";
import { buildSectionEnrollmentLinkPageMetadata } from "@/lib/register/buildSectionEnrollmentLinkPageMetadata";
import { sectionReferenceImagePublicUrl } from "@/lib/register/sectionReferenceImage";
import { loadShareImageChain } from "@/lib/site/buildResolvedPublicShareMetadata";
import { readRequestSupabasePublicEnv } from "@/lib/supabase/requestPublicEnv";
import { RegisterSurfaceByTemplate } from "@/components/organisms/RegisterSurfaceByTemplate";
import { PublicExperienceShell } from "@/components/organisms/PublicExperienceShell";
import { SectionEnrollmentLinkUnavailable } from "@/components/register/SectionEnrollmentLinkUnavailable";
import { loadRequestSessionEmail } from "@/lib/auth/loadRequestSessionEmail";

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
  const meta = await buildSectionEnrollmentLinkPageMetadata({
    locale,
    brandName: brand.name,
    weekdays: dict.register.sectionLink.weekdays,
    unavailableTitle: dict.register.sectionLink.unavailableTitle,
    link,
  });
  if (!link) return meta;
  const { url: supabaseUrl } = await readRequestSupabasePublicEnv();
  const image = await loadShareImageChain(
    sectionReferenceImagePublicUrl(link.referenceImagePath, supabaseUrl),
  );
  if (!image) return meta;
  return {
    ...meta,
    openGraph: { ...meta.openGraph, images: [{ url: image }] },
    twitter: { ...meta.twitter, images: [image] },
  };
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

  const [
    baseDict,
    brand,
    snapshot,
    legalAgeMajority,
    link,
    sectionOptions,
    { url: supabaseUrl },
    sessionEmail,
  ] = await Promise.all([
    getDictionary(locale),
    resolvePublicBrand(loc),
    loadActiveTheme(),
    getLegalAgeMajorityFromSystem(),
    loadSectionEnrollmentLink(token),
    loadRegistrationSectionOptions(),
    readRequestSupabasePublicEnv(),
    loadRequestSessionEmail(),
  ]);

  const dict = applyLandingContentOverrides(baseDict, snapshot?.theme.content, loc);
  const templateKind = snapshot?.theme.templateKind ?? "classic";

  if (link) {
    const canonical = buildSectionEnrollmentLinkPath(locale, link.sectionName, token);
    const current =
      incomingSlug == null || incomingSlug === ""
        ? `/${locale}/inscripcion/${token}`
        : `/${locale}/inscripcion/${incomingSlug}/${token}`;
    if (current !== canonical) permanentRedirect(canonical);
  }

  if (!link) {
    return (
      <PublicExperienceShell locale={locale} dict={dict} templateKind={templateKind} sessionEmail={sessionEmail}>
        <SectionEnrollmentLinkUnavailable
          locale={locale}
          labels={dict.register.sectionLink}
        />
      </PublicExperienceShell>
    );
  }

  const mediaMap: LandingMediaMap | undefined = snapshot
    ? buildLandingMediaMap(snapshot.media, await createRequestLandingMediaPublicUrlBuilder())
    : undefined;
  const resolvedLink = {
    ...link,
    referenceImagePath: sectionReferenceImagePublicUrl(link.referenceImagePath, supabaseUrl),
  };

  return (
    <PublicExperienceShell locale={locale} dict={dict} templateKind={templateKind} sessionEmail={sessionEmail}>
      <RegisterSurfaceByTemplate
        templateKind={templateKind}
        mediaMap={mediaMap}
        locale={locale}
        dict={dict}
        brand={brand}
        legalAgeMajority={legalAgeMajority}
        sectionOptions={sectionOptions}
        enrollmentLink={resolvedLink}
        sessionEmail={sessionEmail}
      />
    </PublicExperienceShell>
  );
}
