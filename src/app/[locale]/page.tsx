import type { Metadata } from "next";
import { type AppLocale } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolvePublicBrandWithSetup } from "@/lib/brand/resolvePublicBrand";
import { LandingSurfaceGate } from "@/components/organisms/LandingSurfaceGate";
import { LandingGreenfieldSurfaceGate } from "@/components/organisms/LandingGreenfieldSurfaceGate";
import { LandingGreenfieldPendingMain } from "@/components/organisms/LandingGreenfieldPendingMain";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import type { MarketingLandingBrand } from "@/lib/landing/mzLandingCopy";
import {
  isMarketingFullBleedLandingKind,
  marketingLandingSuppressesShellFooter,
} from "@/lib/theme/marketingLandingKinds";
import { applyLandingContentOverrides } from "@/lib/cms/applyLandingContentOverrides";
import { buildLandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { createLandingMediaPublicUrlBuilder } from "@/lib/cms/landingMediaPublicUrl";
import { groupBlocksBySection } from "@/lib/cms/landingBlocksCatalog";
import { loadFirstRunWizardMode } from "@/lib/site/loadFirstRunWizardMode";
import { loadBlogEnabled } from "@/lib/blog/loadBlogEnabled";
import { loadMerchEnabled } from "@/lib/shop/loadMerchEnabled";
import { loadLandingMainSections } from "@/lib/landing/loadLandingMainSections";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";
import { getPublicCtaMode } from "@/lib/settings/getPublicCtaMode";
import { loadLandingQuestionnaires } from "@/lib/questionnaires/loadLandingQuestionnaires";
import { LandingQuestionnairesSection } from "@/components/organisms/LandingQuestionnairesSection";
import { HomeEventPopup } from "@/components/organisms/HomeEventPopup";
import { loadHomeEventPopup } from "@/lib/dashboard/events/loadHomeEventPopup";
import { buildHomePageMetadata } from "@/lib/metadata/buildHomePageMetadata";
import type { SiteThemeKind } from "@/types/theming";

/** Session must reflect cookies each request (avoid stale static HTML). */
export const dynamic = "force-dynamic";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const MARKETING_FOOTER_BRAND: Partial<
  Record<SiteThemeKind, MarketingLandingBrand>
> = {
  mozarthitos: "mz",
  espaciozenit: "ez",
  nago: "nago",
  mimundo: "mm",
  liora: "liora",
};

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const { brand } = await resolvePublicBrandWithSetup(locale as AppLocale);
  return buildHomePageMetadata(brand.name);
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const loc = locale as AppLocale;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sessionEmail = user?.email ?? null;

  const { brand, needsInitialSiteSetup, dict: baseDict } =
    await resolvePublicBrandWithSetup(loc);

  if (needsInitialSiteSetup) {
    const wizardMode = await loadFirstRunWizardMode();
    const bootstrapAccountPending = wizardMode === "bootstrap_account";

    return (
      <LandingGreenfieldSurfaceGate
        brand={brand}
        dict={baseDict}
        locale={locale}
        sessionEmail={sessionEmail}
        bootstrapAccountPending={bootstrapAccountPending}
        main={<LandingGreenfieldPendingMain locale={locale} dict={baseDict} />}
      />
    );
  }

  const [activeTheme, blogEnabled, merchEnabled, publicCtaMode, inscriptionsEnabled, landingQuestionnaires, homePopupEvents] =
    await Promise.all([
      loadActiveTheme(),
      loadBlogEnabled(),
      loadMerchEnabled(),
      getPublicCtaMode(),
      getInscriptionsEnabled(),
      loadLandingQuestionnaires(supabase, locale),
      loadHomeEventPopup(supabase, locale),
    ]);

  const dict = applyLandingContentOverrides(
    baseDict,
    activeTheme?.theme.content,
    locale,
  );
  const mediaMap = activeTheme
    ? buildLandingMediaMap(activeTheme.media, createLandingMediaPublicUrlBuilder())
    : undefined;
  const blocksBySection = activeTheme
    ? groupBlocksBySection(activeTheme.theme.blocks)
    : undefined;
  const templateKind = activeTheme?.theme.templateKind ?? "classic";
  const marketingShell = isMarketingFullBleedLandingKind(templateKind);
  const LandingSections = await loadLandingMainSections(templateKind);

  const main = (
    <>
      <LandingSections
        dict={dict}
        brand={brand}
        locale={locale}
        mediaMap={mediaMap}
        blocksBySection={blocksBySection}
        blogEnabled={blogEnabled}
        merchEnabled={merchEnabled}
        sessionEmail={sessionEmail}
        publicCtaMode={publicCtaMode}
        inscriptionsEnabled={inscriptionsEnabled}
      />
      <LandingQuestionnairesSection
        locale={locale}
        items={landingQuestionnaires}
        labels={dict.landing.questionnaires}
      />
    </>
  );

  const popup = dict.events.public.homePopup;
  return (
    <>
      <HomeEventPopup
        locale={locale}
        events={homePopupEvents}
        labels={{
          dialogTitle: popup.dialogTitle,
          close: popup.close,
          previous: popup.previous,
          next: popup.next,
          position: popup.position,
          dateLabel: dict.events.public.dateLabel,
          locationLabel: dict.events.public.locationLabel,
          viewEvent: dict.events.public.viewDetail,
          imageLoading: popup.imageLoading,
          free: dict.events.public.free,
          priceLocal: dict.events.public.priceLocal,
          priceNonLocal: dict.events.public.priceNonLocal,
        }}
      />
      <LandingSurfaceGate
        main={main}
        brand={brand}
        dict={dict}
        locale={locale}
        sessionEmail={sessionEmail}
        blogEnabled={blogEnabled}
        merchEnabled={merchEnabled}
        suppressHeader={marketingShell}
        suppressPwaHeader={marketingShell}
        suppressMarketingShellFooter={marketingLandingSuppressesShellFooter(
          templateKind,
        )}
        marketingFullBleedShell={marketingShell}
        marketingLandingFooterBrand={MARKETING_FOOTER_BRAND[templateKind]}
      />
    </>
  );
}
