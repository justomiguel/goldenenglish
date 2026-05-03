import type { Dictionary } from "@/types/i18n";
import type { MarketingLandingBrand } from "@/lib/landing/mzLandingCopy";
import { MozarthitosReveal } from "@/components/molecules/MozarthitosReveal";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";

export interface LandingMozarthitosSedesSectionProps {
  dict: Dictionary;
  mapSrc: string;
  marketingBrand?: MarketingLandingBrand;
}

export function LandingMozarthitosSedesSection({
  dict,
  mapSrc,
  marketingBrand = "mz",
}: LandingMozarthitosSedesSectionProps) {
  return (
    <section
      id="sedes"
      className="mz-sedes-surface relative z-[12] scroll-mt-[max(6rem,env(safe-area-inset-top)+5rem)] -mt-10 rounded-t-[28px] pb-[max(3rem,env(safe-area-inset-bottom))] pt-12 shadow-[0_-18px_48px_rgb(0_0_0_/12%)] sm:-mt-12 sm:rounded-t-[36px] sm:pb-12 md:-mt-16 md:rounded-t-[48px] md:pb-16 md:pt-20"
    >
      <div className="relative z-[2]">
        <MozarthitosReveal
          preset="sedesIntro"
          className="mx-auto max-w-6xl space-y-3 px-[max(1rem,env(safe-area-inset-left))] pb-8 text-center sm:space-y-4 sm:pb-10 md:pb-14 lg:px-6"
        >
          <h2 className="mz-section-heading text-balance text-[clamp(1.65rem,4.5vw+0.5rem,3.75rem)] px-1 md:text-5xl lg:text-6xl">
            {marketingLandingCopy(dict, marketingBrand, "sedes.sectionTitle")}
          </h2>
          <p className="text-base text-white/90 sm:text-lg md:text-xl">
            {marketingLandingCopy(dict, marketingBrand, "sedes.sectionSubtitle")}
          </p>
        </MozarthitosReveal>
        <MozarthitosReveal
          preset="sedeDetail"
          className="mx-auto max-w-4xl space-y-6 px-[max(1rem,env(safe-area-inset-left))] pb-4 text-center sm:pb-6 md:pb-8 lg:px-6"
        >
          <div className="mz-sedes-card mx-auto space-y-3 px-4 pb-5 pt-7 sm:px-6 md:px-8 md:pb-8 md:pt-10">
            <h3 className="text-xl font-semibold sm:text-2xl md:text-3xl">
              {marketingLandingCopy(dict, marketingBrand, "sede.title")}
            </h3>
            <p className="text-sm text-white/90 sm:text-base md:text-lg">
              {marketingLandingCopy(dict, marketingBrand, "sede.subtitle")}
            </p>
            {mapSrc ? (
              <div className="-mx-1 overflow-hidden rounded-[18px] bg-black/10 shadow-inner sm:mx-0 sm:rounded-[22px]">
                <iframe
                  title={marketingLandingCopy(dict, marketingBrand, "map.iframeTitle")}
                  src={mapSrc}
                  className="aspect-video min-h-[200px] w-full sm:min-h-[240px] md:min-h-[300px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : null}
          </div>
        </MozarthitosReveal>
      </div>
    </section>
  );
}
