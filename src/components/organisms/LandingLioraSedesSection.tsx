import Image from "next/image";
import { MapPin } from "lucide-react";
import { LIORA_SEDE_KEYS, type LioraSedeKey } from "@/lib/landing/lioraSchedule";

/** Orden de las tarjetas de sede = orden de los slots de media en `modalidades`. */
const SEDE_MEDIA_POSITION: Readonly<Record<LioraSedeKey, number>> = {
  providencia: 1,
  maipu: 2,
  sanMiguel: 3,
};

interface LandingLioraSedesSectionProps {
  /** Reads `dict.landing.liora.<path>`. */
  t: (path: string) => string;
  /** Resolves a landing image, CMS override first. */
  img: (section: "inicio" | "historia" | "modalidades" | "oferta", file: string) => string;
}

export function LandingLioraSedesSection({ t, img }: LandingLioraSedesSectionProps) {
  return (
    <section
      id="sedes"
      className="liora-band-cream scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="liora-kicker text-[var(--liora-rose-deep)]">
            {t("sedes.kicker")}
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-liora-display)] text-4xl font-light tracking-[0.12em] text-[var(--liora-ink)] md:text-5xl">
            {t("sedes.sectionTitle")}
          </h2>
          <div className="liora-flourish mt-5" aria-hidden />
          <p className="mx-auto mt-6 max-w-2xl text-pretty leading-relaxed text-[var(--liora-ink-soft)]">
            {t("sedes.lead")}
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {LIORA_SEDE_KEYS.map((sedeKey) => (
            <article key={sedeKey} className="liora-card overflow-hidden">
              <Image
                src={img("modalidades", `${SEDE_MEDIA_POSITION[sedeKey]}.jpg`)}
                alt=""
                width={480}
                height={600}
                className="h-64 w-full bg-[var(--liora-blush)] object-contain p-4"
                sizes="(max-width:768px) 90vw, 30vw"
              />
              <div className="border-t border-[var(--liora-line)] p-6">
                <h3 className="font-[family-name:var(--font-liora-display)] text-2xl font-light tracking-[0.1em] text-[var(--liora-ink)]">
                  {t(`sedes.${sedeKey}.name`)}
                </h3>
                <p className="mt-2 flex items-start gap-2 text-sm text-[var(--liora-rose-deep)]">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden
                    strokeWidth={1.5}
                  />
                  {t(`sedes.${sedeKey}.metro`)}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--liora-ink-soft)]">
                  {t(`sedes.${sedeKey}.body`)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
