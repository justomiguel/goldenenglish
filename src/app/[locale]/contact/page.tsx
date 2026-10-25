import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getDictionary,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { resolvePublicBrandWithSetup } from "@/lib/brand/resolvePublicBrand";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { applyLandingContentOverrides } from "@/lib/cms/applyLandingContentOverrides";
import { buildLandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { createRequestLandingMediaPublicUrlBuilder } from "@/lib/cms/landingMediaPublicUrl";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { PublicContactScreenClassic } from "@/components/organisms/PublicContactScreenClassic";
import { PublicContactScreenEspacioZenit } from "@/components/organisms/PublicContactScreenEspacioZenit";
import { PublicContactScreenMozarthitos } from "@/components/organisms/PublicContactScreenMozarthitos";
import { PublicContactScreenNago } from "@/components/organisms/PublicContactScreenNago";
import { PublicContactScreenLiora } from "@/components/organisms/PublicContactScreenLiora";
import { PublicContactScreenMiMundo } from "@/components/organisms/PublicContactScreenMiMundo";
import { PublicExperienceShell } from "@/components/organisms/PublicExperienceShell";
import { loadRequestSessionEmail } from "@/lib/auth/loadRequestSessionEmail";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const pc = dict.publicContact;
  return {
    title: pc.metaTitle,
    description: pc.metaDescription,
    robots: { index: true, follow: true },
  };
}

export default async function PublicContactPage({ params }: PageProps) {
  const { locale } = await params;
  const loc = locale as AppLocale;

  const [{ brand, needsInitialSiteSetup, dict: baseDict }, snapshot, sessionEmail] = await Promise.all([
    resolvePublicBrandWithSetup(loc),
    loadActiveTheme(),
    loadRequestSessionEmail(),
  ]);

  if (needsInitialSiteSetup) {
    redirect(`/${locale}`);
  }

  const dict = applyLandingContentOverrides(baseDict, snapshot?.theme.content, loc);

  const templateKind = snapshot?.theme.templateKind ?? "classic";
  const mediaMap: LandingMediaMap | undefined = snapshot
    ? buildLandingMediaMap(
        snapshot.media,
        await createRequestLandingMediaPublicUrlBuilder(),
      )
    : undefined;

  const screen =
    templateKind === "espaciozenit" ? (
      <PublicContactScreenEspacioZenit locale={locale} dict={dict} brand={brand} mediaMap={mediaMap} sessionEmail={sessionEmail} />
    ) : templateKind === "mozarthitos" ? (
      <PublicContactScreenMozarthitos locale={locale} dict={dict} brand={brand} mediaMap={mediaMap} sessionEmail={sessionEmail} />
    ) : templateKind === "nago" ? (
      <PublicContactScreenNago locale={locale} dict={dict} brand={brand} sessionEmail={sessionEmail} />
    ) : templateKind === "mimundo" ? (
      <PublicContactScreenMiMundo locale={locale} dict={dict} brand={brand} sessionEmail={sessionEmail} />
    ) : templateKind === "liora" ? (
      <PublicContactScreenLiora locale={locale} dict={dict} brand={brand} sessionEmail={sessionEmail} />
    ) : (
      <PublicContactScreenClassic locale={locale} dict={dict} brand={brand} sessionEmail={sessionEmail} />
    );

  return (
    <PublicExperienceShell locale={locale} dict={dict} templateKind={templateKind} sessionEmail={sessionEmail}>
      {screen}
    </PublicExperienceShell>
  );
}
