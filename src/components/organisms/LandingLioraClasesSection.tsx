import Image from "next/image";
import { Sparkles } from "lucide-react";
import { LIORA_CLASS_KEYS } from "@/lib/landing/lioraSchedule";
import { LioraSectionHeading } from "@/components/molecules/LioraSectionHeading";

interface LandingLioraClasesSectionProps {
  /** Reads `dict.landing.liora.<path>`. */
  t: (path: string) => string;
  /** Resolves a landing image, CMS override first. */
  img: (section: "inicio" | "historia" | "modalidades" | "oferta", file: string) => string;
}

export function LandingLioraClasesSection({ t, img }: LandingLioraClasesSectionProps) {
  return (
    <section
      id="clases"
      className="liora-section liora-band-blush"
      data-liora-anchor="clases"
      data-liora-side="start"
    >
      <div className="relative z-10 mx-auto max-w-6xl">
        <LioraSectionHeading
          align="start"
          title={t("clases.sectionTitle")}
          script={t("clases.titleScript")}
          lead={t("clases.lead")}
        />

        {/* Narrow: native swipe list with snap and a peek of the next card. */}
        <ul
          aria-label={t("clases.sectionTitle")}
          className="-mx-6 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-6 pb-4 [scrollbar-width:none] sm:mx-0 sm:mt-14 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
        >
          {LIORA_CLASS_KEYS.map((key, i) => (
            <li key={key} className="w-[82%] shrink-0 snap-start sm:w-auto">
            <article className="liora-card flex h-full flex-col overflow-hidden">
              <div className="relative aspect-[4/3] w-full sm:aspect-[4/5]">
                <Image
                  src={img("oferta", `${i + 1}.jpg`)}
                  alt=""
                  width={360}
                  height={450}
                  className="h-full w-full object-cover"
                  sizes="(max-width:640px) 90vw, (max-width:1024px) 45vw, 22vw"
                />
                <span className="liora-pill absolute bottom-3 start-3">
                  {t(`clases.${key}.ages`)}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="flex items-center gap-2 font-[family-name:var(--font-liora-display)] text-2xl font-medium text-[var(--liora-rose-title)]">
                  <Sparkles className="h-4 w-4 shrink-0 text-[var(--liora-rose)]" aria-hidden strokeWidth={1.5} />
                  {t(`clases.${key}.title`)}
                </h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--liora-ink-soft)] md:text-sm">
                  {t(`clases.${key}.body`)}
                </p>
              </div>
            </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
