import Image from "next/image";
import Link from "next/link";
import { Laptop } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { MozarthitosReveal } from "@/components/molecules/MozarthitosReveal";
import { mzLandingCopy } from "@/lib/landing/mzLandingCopy";

export interface LandingMozarthitosCursosSectionProps {
  dict: Dictionary;
  locale: string;
  imgOferta: (filename: string) => string;
}

export function LandingMozarthitosCursosSection({
  dict,
  locale,
  imgOferta,
}: LandingMozarthitosCursosSectionProps) {
  return (
    <section
      id="cursos"
      className="mz-cursos-surface relative z-[11] scroll-mt-[max(6rem,env(safe-area-inset-top)+5rem)] -mt-12 rounded-t-[28px] px-[max(1rem,env(safe-area-inset-left))] pb-[max(4rem,env(safe-area-inset-bottom))] pt-14 shadow-[0_-28px_60px_rgb(255_69_93_/14%)] sm:-mt-14 sm:rounded-t-[40px] md:-mt-20 md:rounded-t-[52px] md:pb-24 md:pt-24 lg:px-6"
    >
      <div
        className="pointer-events-none absolute left-[max(0.75rem,env(safe-area-inset-left))] top-24 hidden h-44 w-2 rounded-full bg-[var(--mz-yellow)] opacity-90 lg:block"
        aria-hidden
      />
      <div className="relative z-[2] mx-auto max-w-6xl">
        <MozarthitosReveal
          preset="cursosMainStack"
          className="mb-10 max-w-3xl sm:mb-12 md:mb-16"
        >
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[var(--mz-blue-heading)] sm:text-xs sm:tracking-[0.25em]">
            {mzLandingCopy(dict, "nav.cursos")}
          </p>
          <h2 className="mz-section-heading mt-2 text-balance text-[clamp(1.75rem,5vw+0.5rem,3.75rem)] text-[var(--mz-pink)]">
            {mzLandingCopy(dict, "cursos.title")}
          </h2>
          <p className="mt-2 text-lg font-semibold text-[var(--mz-pink)] sm:mt-3 sm:text-xl md:text-2xl">
            {mzLandingCopy(dict, "cursos.subtitle")}
          </p>
          <p className="mt-2 text-base font-bold text-[var(--mz-blue-heading)] sm:mt-3 sm:text-lg md:text-xl">
            {mzLandingCopy(dict, "cursos.ageLine")}
          </p>
        </MozarthitosReveal>
        <div className="grid gap-10 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] md:items-start md:gap-12 lg:gap-16">
          <MozarthitosReveal
            preset="cursosAsideDesktop"
            className="order-3 hidden md:order-1 md:block"
          >
            <div className="mz-cursos-visual-wrap mx-auto max-w-[400px] lg:max-w-[440px]">
              <span
                className="mz-blob mz-blob--pink -left-4 top-8 h-28 w-28 opacity-90 sm:h-32 sm:w-32 lg:-left-8 lg:h-36 lg:w-36"
                aria-hidden
              />
              <span
                className="mz-blob mz-blob--blue bottom-2 right-1 h-20 w-20 opacity-80 sm:right-2 sm:h-24 sm:w-24 lg:h-28 lg:w-28"
                aria-hidden
              />
              <div className="mz-cursos-visual-inner flex justify-center lg:justify-start">
                <Image
                  src={imgOferta("1.png")}
                  alt=""
                  width={972}
                  height={838}
                  className="mz-cursos-photo relative z-[1] aspect-square w-full max-w-[min(100%,280px)] rounded-[28px] object-cover shadow-[0_24px_50px_rgb(55_164_255_/28%)] md:max-w-[min(100%,360px)] lg:max-w-[min(100%,400px)]"
                  sizes="(max-width: 768px) 90vw, (max-width: 1280px) 360px, 400px"
                />
              </div>
            </div>
          </MozarthitosReveal>
          <MozarthitosReveal
            preset="cursosMainStack"
            className="order-2 min-w-0 space-y-6 sm:space-y-8 md:order-2"
          >
            <div className="overflow-hidden rounded-[20px] border-2 border-[var(--mz-pink)]/15 bg-[var(--mz-pink)]/[0.04] p-4 sm:rounded-[24px] sm:p-5 md:p-7">
              <Image
                src={imgOferta("2.png")}
                alt=""
                width={1024}
                height={289}
                className="mx-auto w-full max-h-[min(48vw,220px)] max-w-xl object-contain drop-shadow-sm sm:max-h-none"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, 640px"
              />
            </div>
            <div className="space-y-4 text-[0.9375rem] leading-relaxed text-[var(--mz-ink-on-white)] sm:text-base md:text-lg">
              <p>{mzLandingCopy(dict, "cursos.bodyP1")}</p>
              <p>{mzLandingCopy(dict, "cursos.bodyP2")}</p>
            </div>
            <Link
              href={`/${locale}#contacto`}
              className="mz-btn-shrink inline-flex min-h-[48px] w-full max-w-md items-center justify-center gap-2 rounded-full bg-[var(--mz-blue-btn)] px-6 py-3.5 text-base font-bold text-white shadow-[0_10px_28px_rgb(0_165_255_/38%)] transition-colors hover:bg-[var(--mz-blue-btn-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mz-blue-btn)] focus-visible:ring-offset-2 sm:w-auto"
            >
              <Laptop className="h-4 w-4 shrink-0" aria-hidden />
              {mzLandingCopy(dict, "cursos.onlineCta")}
            </Link>
          </MozarthitosReveal>
          <MozarthitosReveal
            preset="cursosAsideMobile"
            className="order-1 md:hidden"
          >
            <div className="mz-cursos-visual-wrap mx-auto max-w-[min(100%,320px)]">
              <span
                className="mz-blob mz-blob--pink -left-1 top-10 h-24 w-24 opacity-95"
                aria-hidden
              />
              <span
                className="mz-blob mz-blob--blue bottom-4 right-1 h-14 w-14 opacity-85 sm:right-2 sm:h-16 sm:w-16"
                aria-hidden
              />
              <div className="mz-cursos-visual-inner flex justify-center">
                <Image
                  src={imgOferta("1.png")}
                  alt=""
                  width={972}
                  height={838}
                  className="mz-cursos-photo relative z-[1] aspect-square w-full max-w-[min(100%,280px)] rounded-[26px] object-cover shadow-[0_20px_44px_rgb(55_164_255_/28%)]"
                  sizes="min(280px, 100vw)"
                />
              </div>
            </div>
          </MozarthitosReveal>
        </div>
      </div>
    </section>
  );
}
