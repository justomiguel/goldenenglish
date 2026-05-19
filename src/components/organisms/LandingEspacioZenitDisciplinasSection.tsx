import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import {
  EZ_DISCIPLINE_BALLET_SRC,
  EZ_DISCIPLINE_HIPHOP_SRC,
} from "@/lib/landing/espacioZenitLandingMedia";
import { MozarthitosReveal } from "@/components/molecules/MozarthitosReveal";

export interface LandingEspacioZenitDisciplinasSectionProps {
  dict: Dictionary;
  locale: string;
}

export function LandingEspacioZenitDisciplinasSection({
  dict,
  locale,
}: LandingEspacioZenitDisciplinasSectionProps) {
  const brand = "ez" as const;
  const prefix = `/${locale}`;
  const verMas = marketingLandingCopy(dict, brand, "disciplinas.verMas");

  return (
    <section
      id="disciplinas"
      className="ez-mock-disciplinas relative z-[8] scroll-mt-[max(6rem,env(safe-area-inset-top)+5rem)] bg-black px-[max(1rem,env(safe-area-inset-left))] pb-16 pt-14 md:pb-24 md:pt-18 lg:px-6"
      aria-labelledby="ez-mock-disciplinas-heading"
    >
      <div className="relative z-[1] mx-auto max-w-6xl">
        <MozarthitosReveal preset="quienesHeading" className="mb-10 md:mb-14">
          <div className="text-center">
            <h2
              id="ez-mock-disciplinas-heading"
              className="text-lg font-bold uppercase tracking-[0.28em] text-[var(--ez-cyan)] md:text-xl"
            >
              {marketingLandingCopy(dict, brand, "disciplinas.sectionTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base">
              {marketingLandingCopy(dict, brand, "disciplinas.lead")}
            </p>
          </div>
        </MozarthitosReveal>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <MozarthitosReveal preset="origenesCard">
            <article className="ez-mock-discipline-card ez-mock-discipline-card--hiphop flex h-full flex-col overflow-hidden rounded-[22px] border border-[rgb(0_174_239_/40%)] bg-[#070b12] shadow-[0_28px_70px_rgb(0_0_0_/55%)]">
              <div className="relative aspect-[16/11] w-full bg-[#111827]">
                <Image
                  src={EZ_DISCIPLINE_HIPHOP_SRC}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="(max-width:1024px) 100vw, 50vw"
                />
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
                <p className="ez-mock-discipline-hiphop-title ez-mock-brush--cyan text-[clamp(1.65rem,4vw,2.35rem)] leading-tight">
                  {marketingLandingCopy(dict, brand, "disciplinas.hiphop.title")}
                </p>
                <p className="text-sm leading-relaxed text-white/82 md:text-base">
                  {marketingLandingCopy(dict, brand, "disciplinas.hiphop.body")}
                </p>
                <Link
                  href={`${prefix}/register`}
                  className="mt-auto inline-flex min-h-[44px] w-fit items-center justify-center gap-2 rounded-xl bg-[var(--ez-cyan)] px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-black transition hover:bg-[var(--ez-cyan-soft)]"
                >
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  {verMas}
                </Link>
              </div>
            </article>
          </MozarthitosReveal>

          <MozarthitosReveal preset="llegadaCard">
            <article className="ez-mock-discipline-card ez-mock-discipline-card--ballet flex h-full flex-col overflow-hidden rounded-[22px] border border-[rgb(255_255_255_/18%)] bg-[#07080c] shadow-[0_28px_70px_rgb(0_0_0_/50%)]">
              <div className="relative aspect-[16/11] w-full bg-[#1c1917]">
                <Image
                  src={EZ_DISCIPLINE_BALLET_SRC}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="(max-width:1024px) 100vw, 50vw"
                />
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
                <p className="ez-mock-discipline-ballet-title text-[clamp(1.35rem,3.2vw,2rem)] font-normal capitalize tracking-[0.06em] text-white">
                  {marketingLandingCopy(dict, brand, "disciplinas.ballet.title")}
                </p>
                <p className="text-sm leading-relaxed text-white/82 md:text-base">
                  {marketingLandingCopy(dict, brand, "disciplinas.ballet.body")}
                </p>
                <Link
                  href={`${prefix}/register`}
                  className="mt-auto inline-flex min-h-[44px] w-fit items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--ez-ink)] transition hover:brightness-105 ez-mock-ballet-cta"
                >
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  {verMas}
                </Link>
              </div>
            </article>
          </MozarthitosReveal>
        </div>
      </div>
    </section>
  );
}
