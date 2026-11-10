import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { LandingLioraHero } from "@/components/organisms/LandingLioraHero";
import { LandingLioraSobre } from "@/components/organisms/LandingLioraSobre";
import { LandingLioraClasesSection } from "@/components/organisms/LandingLioraClasesSection";
import { LandingLioraSedesSection } from "@/components/organisms/LandingLioraSedesSection";
import { LandingLioraHorariosSection } from "@/components/organisms/LandingLioraHorariosSection";
import { LioraLandingGallery } from "@/components/organisms/LioraLandingGallery";
import { LioraLandingContactPanel } from "@/components/organisms/LioraLandingContactPanel";
import { LandingLioraFooter } from "@/components/organisms/LandingLioraFooter";
import { LioraSectionHeading } from "@/components/molecules/LioraSectionHeading";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";

interface LandingLioraSectionsProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  mediaMap?: LandingMediaMap;
  publicCtaMode?: PublicCtaMode;
  inscriptionsEnabled?: boolean;
  sessionEmail?: string | null;
}

/**
 * Every section that the ribbon visits carries `data-liora-anchor` and
 * `data-liora-side` (the side of its text). `LioraRibbonOverlay` reads them.
 */
export function LandingLioraSections({
  dict,
  brand,
  locale,
  mediaMap,
  publicCtaMode,
  inscriptionsEnabled,
  sessionEmail = null,
}: LandingLioraSectionsProps) {
  const t = (path: string) => marketingLandingCopy(dict, "liora", path);
  const img = (
    section: "inicio" | "historia" | "modalidades" | "oferta",
    file: string,
  ) => resolveLandingImageSrcForTheme("liora", section, file, mediaMap);

  return (
    <>
      <LandingLioraHero
        dict={dict}
        brand={brand}
        locale={locale}
        t={t}
        heroSrc={img("inicio", "1.jpg")}
        publicCtaMode={publicCtaMode}
        inscriptionsEnabled={inscriptionsEnabled}
      />

      {/* Narrow screens show the next event here instead of a modal. */}
      <div id="home-event-inline-slot" />

      <LandingLioraSobre t={t} photoSrc={img("historia", "1.jpg")} />

      <LandingLioraClasesSection t={t} img={img} />

      <LandingLioraSedesSection t={t} img={img} />

      <LandingLioraHorariosSection t={t} />

      <LioraLandingGallery dict={dict} />

      <section
        id="cta"
        className="liora-section liora-band-cream pb-[max(4rem,env(safe-area-inset-bottom))]"
        data-liora-anchor="cta"
        data-liora-side="center"
      >
        <div className="relative z-10 mx-auto max-w-5xl">
          <LioraSectionHeading
            title={t("cta.title")}
            script={t("cta.titleScript")}
            lead={t("cta.subtitle")}
          />
          <LioraLandingContactPanel dict={dict} locale={locale} />
        </div>
      </section>

      <LandingLioraFooter
        dict={dict}
        brand={brand}
        locale={locale}
        t={t}
        sessionEmail={sessionEmail}
      />
    </>
  );
}
