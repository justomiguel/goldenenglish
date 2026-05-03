import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { MozarthitosReveal } from "@/components/molecules/MozarthitosReveal";

export interface LandingEspacioZenitPlaceholderRailProps {
  dict: Dictionary;
}

export function LandingEspacioZenitPlaceholderRail({
  dict,
}: LandingEspacioZenitPlaceholderRailProps) {
  const brand = "ez" as const;

  return (
    <>
      <section
        id="horarios"
        className="scroll-mt-[max(6rem,env(safe-area-inset-top)+5rem)] bg-[#070b12] px-[max(1rem,env(safe-area-inset-left))] py-14 lg:px-6"
        aria-labelledby="ez-mock-horarios-heading"
      >
        <div className="mx-auto max-w-6xl">
          <MozarthitosReveal preset="cursosAsideDesktop">
            <h2
              id="ez-mock-horarios-heading"
              className="text-lg font-bold uppercase tracking-[0.22em] text-[var(--ez-cyan)]"
            >
              {marketingLandingCopy(dict, brand, "horarios.title")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base">
              {marketingLandingCopy(dict, brand, "horarios.body")}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-[rgb(0_174_239_/35%)] bg-black/60 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/38"
                >
                  {marketingLandingCopy(dict, brand, "placeholders.schedule")}
                </div>
              ))}
            </div>
          </MozarthitosReveal>
        </div>
      </section>

      <section
        id="galeria"
        className="scroll-mt-[max(6rem,env(safe-area-inset-top)+5rem)] bg-black px-[max(1rem,env(safe-area-inset-left))] py-14 lg:px-6"
        aria-labelledby="ez-mock-galeria-heading"
      >
        <div className="mx-auto max-w-6xl">
          <MozarthitosReveal preset="cursosMainStack">
            <h2
              id="ez-mock-galeria-heading"
              className="text-lg font-bold uppercase tracking-[0.22em] text-[var(--ez-cyan)]"
            >
              {marketingLandingCopy(dict, brand, "galeria.title")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base">
              {marketingLandingCopy(dict, brand, "galeria.body")}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl border border-[rgb(255_255_255_/12%)] bg-gradient-to-br from-[#111827] to-black text-center text-[10px] font-semibold uppercase leading-tight tracking-[0.16em] text-white/35 flex items-center justify-center p-2"
                >
                  {marketingLandingCopy(dict, brand, "placeholders.gallery")}
                </div>
              ))}
            </div>
          </MozarthitosReveal>
        </div>
      </section>
    </>
  );
}
