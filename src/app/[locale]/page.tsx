import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandPublic } from "@/lib/brand/server";
import { createClient } from "@/lib/supabase/server";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";
import { LandingSurfaceGate } from "@/components/organisms/LandingSurfaceGate";
import { LandingScreenDesktop } from "@/components/desktop/organisms/LandingScreenDesktop";
import { LandingMainSections } from "@/components/organisms/LandingMainSections";
import { LandingMainSectionsEditorial } from "@/components/organisms/LandingMainSectionsEditorial";
import { LandingMainSectionsMinimal } from "@/components/organisms/LandingMainSectionsMinimal";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { applyLandingContentOverrides } from "@/lib/cms/applyLandingContentOverrides";
import { buildLandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { createLandingMediaPublicUrlBuilder } from "@/lib/cms/landingMediaPublicUrl";
import { groupBlocksBySection } from "@/lib/cms/landingBlocksCatalog";

/** Session must reflect cookies each request (avoid stale static HTML). */
export const dynamic = "force-dynamic";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sessionEmail = user?.email ?? null;

  const [baseDict, brand, inscriptionsOpen, activeTheme] = await Promise.all([
    getDictionary(locale),
    Promise.resolve(getBrandPublic()),
    getInscriptionsEnabled(),
    loadActiveTheme(),
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

  const sharedShellProps = {
    dict,
    brand,
    locale,
    sessionEmail,
    inscriptionsOpen,
    mediaMap,
    blocksBySection,
  };

  const main =
    templateKind === "editorial" ? (
      <LandingMainSectionsEditorial {...sharedShellProps} />
    ) : templateKind === "minimal" ? (
      <LandingMainSectionsMinimal {...sharedShellProps} />
    ) : (
      <LandingMainSections {...sharedShellProps} />
    );

  return (
    <LandingSurfaceGate
      desktop={
        <LandingScreenDesktop
          brand={brand}
          dict={dict}
          locale={locale}
          sessionEmail={sessionEmail}
        >
          {main}
        </LandingScreenDesktop>
      }
      main={main}
      brand={brand}
      dict={dict}
      locale={locale}
      sessionEmail={sessionEmail}
    />
  );
}
