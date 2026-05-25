import { type AppLocale } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolvePublicBrandWithSetup } from "@/lib/brand/resolvePublicBrand";
import { LandingSurfaceGate } from "@/components/organisms/LandingSurfaceGate";
import { LandingGreenfieldSurfaceGate } from "@/components/organisms/LandingGreenfieldSurfaceGate";
import { LandingGreenfieldPendingMain } from "@/components/organisms/LandingGreenfieldPendingMain";
import { LandingScreenDesktop } from "@/components/desktop/organisms/LandingScreenDesktop";
import { LandingMainSections } from "@/components/organisms/LandingMainSections";
import { LandingMainSectionsEditorial } from "@/components/organisms/LandingMainSectionsEditorial";
import { LandingMainSectionsMinimal } from "@/components/organisms/LandingMainSectionsMinimal";
import { LandingMainSectionsMozarthitos } from "@/components/organisms/LandingMainSectionsMozarthitos";
import { LandingMainSectionsEspacioZenit } from "@/components/organisms/LandingMainSectionsEspacioZenit";
import { LandingMainSectionsNago } from "@/components/organisms/LandingMainSectionsNago";
import { LandingMainSectionsMimundo } from "@/components/organisms/LandingMainSectionsMimundo";
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

/** Session must reflect cookies each request (avoid stale static HTML). */
export const dynamic = "force-dynamic";

interface HomePageProps {
  params: Promise<{ locale: string }>;
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

  const activeTheme = await loadActiveTheme();

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
  const suppressMarketingShellFooter =
    marketingLandingSuppressesShellFooter(templateKind);
  const marketingFooterBrand: MarketingLandingBrand | undefined =
    templateKind === "mozarthitos"
      ? "mz"
      : templateKind === "espaciozenit"
        ? "ez"
        : templateKind === "nago"
          ? "nago"
          : templateKind === "mimundo"
            ? "mm"
            : undefined;

  const landingContentProps = {
    dict,
    brand,
    locale,
    mediaMap,
    blocksBySection,
  };
  const marketingTenantProps = {
    ...landingContentProps,
    sessionEmail,
  };

  const main =
    templateKind === "editorial" ? (
      <LandingMainSectionsEditorial {...landingContentProps} />
    ) : templateKind === "minimal" ? (
      <LandingMainSectionsMinimal {...landingContentProps} />
    ) : templateKind === "mozarthitos" ? (
      <LandingMainSectionsMozarthitos {...marketingTenantProps} />
    ) : templateKind === "espaciozenit" ? (
      <LandingMainSectionsEspacioZenit {...marketingTenantProps} />
    ) : templateKind === "nago" ? (
      <LandingMainSectionsNago {...marketingTenantProps} />
    ) : templateKind === "mimundo" ? (
      <LandingMainSectionsMimundo {...marketingTenantProps} />
    ) : (
      <LandingMainSections {...landingContentProps} />
    );

  return (
    <LandingSurfaceGate
      desktop={
        <LandingScreenDesktop
          brand={brand}
          dict={dict}
          locale={locale}
          sessionEmail={sessionEmail}
          suppressHeader={marketingShell}
          suppressMarketingShellFooter={suppressMarketingShellFooter}
          marketingFullBleedShell={marketingShell}
          marketingLandingFooterBrand={marketingFooterBrand}
        >
          {main}
        </LandingScreenDesktop>
      }
      main={main}
      brand={brand}
      dict={dict}
      locale={locale}
      sessionEmail={sessionEmail}
      suppressPwaHeader={marketingShell}
      suppressMarketingShellFooter={suppressMarketingShellFooter}
      marketingFullBleedShell={marketingShell}
      marketingLandingFooterBrand={marketingFooterBrand}
    />
  );
}
