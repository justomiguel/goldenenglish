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

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LIORA_CLASS_KEYS.map((key, i) => (
            <article key={key} className="liora-card flex flex-col overflow-hidden">
              <div className="relative aspect-[4/5] w-full">
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
                <p className="mt-3 text-sm leading-relaxed text-[var(--liora-ink-soft)]">
                  {t(`clases.${key}.body`)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
