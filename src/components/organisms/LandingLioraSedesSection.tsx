import Image from "next/image";
import { MapPin, TrainFront } from "lucide-react";
import { LIORA_SEDE_KEYS, type LioraSedeKey } from "@/lib/landing/lioraSchedule";
import { LioraSectionHeading } from "@/components/molecules/LioraSectionHeading";

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
      className="liora-section liora-band-cream"
      data-liora-anchor="sedes"
      data-liora-side="end"
    >
      <div className="relative z-10 mx-auto max-w-6xl">
        <LioraSectionHeading
          align="end"
          title={t("sedes.sectionTitle")}
          script={t("sedes.titleScript")}
          lead={t("sedes.lead")}
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
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
                <h3 className="flex items-center gap-3 font-[family-name:var(--font-liora-display)] text-2xl font-medium text-[var(--liora-rose-title)]">
                  <span className="liora-badge">
                    <MapPin className="h-5 w-5" aria-hidden strokeWidth={1.5} />
                  </span>
                  {t(`sedes.${sedeKey}.name`)}
                </h3>
                <p className="mt-4 flex items-start gap-2 text-sm font-medium text-[var(--liora-rose-text)]">
                  <TrainFront className="mt-0.5 h-4 w-4 shrink-0" aria-hidden strokeWidth={1.5} />
                  {t(`sedes.${sedeKey}.metro`)}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--liora-ink-soft)]">
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
