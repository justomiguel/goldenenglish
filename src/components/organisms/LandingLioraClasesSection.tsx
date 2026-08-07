import Image from "next/image";
import { LIORA_CLASS_KEYS } from "@/lib/landing/lioraSchedule";

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
      className="liora-band-blush scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="liora-kicker text-[var(--liora-rose-deep)]">
            {t("clases.kicker")}
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-liora-display)] text-4xl font-light tracking-[0.12em] text-[var(--liora-ink)] md:text-5xl">
            {t("clases.sectionTitle")}
          </h2>
          <div className="liora-flourish mt-5" aria-hidden />
          <p className="mx-auto mt-6 max-w-2xl text-pretty leading-relaxed text-[var(--liora-ink-soft)]">
            {t("clases.lead")}
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {LIORA_CLASS_KEYS.map((key, i) => (
            <article key={key} className="flex flex-col">
              <div className="liora-arch relative aspect-[3/4] w-full">
                <Image
                  src={img("oferta", `${i + 1}.jpg`)}
                  alt=""
                  width={360}
                  height={480}
                  className="h-full w-full object-cover"
                  sizes="(max-width:640px) 90vw, (max-width:1024px) 45vw, 22vw"
                />
              </div>
              <h3 className="mt-6 font-[family-name:var(--font-liora-display)] text-2xl font-light tracking-[0.08em] text-[var(--liora-ink)]">
                {t(`clases.${key}.title`)}
              </h3>
              <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[var(--liora-rose-deep)]">
                {t(`clases.${key}.ages`)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--liora-ink-soft)]">
                {t(`clases.${key}.body`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
