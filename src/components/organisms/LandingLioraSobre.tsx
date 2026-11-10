import Image from "next/image";
import { CalendarHeart, Flower2, Sparkles } from "lucide-react";
import { LioraSectionHeading } from "@/components/molecules/LioraSectionHeading";

interface LandingLioraSobreProps {
  t: (path: string) => string;
  photoSrc: string;
}

const PILLARS = [
  { key: "pilar1", Icon: Flower2 },
  { key: "pilar2", Icon: Sparkles },
  { key: "pilar3", Icon: CalendarHeart },
] as const;

export function LandingLioraSobre({ t, photoSrc }: LandingLioraSobreProps) {
  return (
    <section
      id="sobre"
      className="liora-section liora-band-cream"
      data-liora-anchor="sobre"
      data-liora-side="end"
    >
      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div className="flex justify-center lg:justify-start">
          <div className="liora-photo-fade relative aspect-[4/5] w-full max-w-md">
            <Image
              src={photoSrc}
              alt=""
              width={520}
              height={650}
              className="h-full w-full object-cover"
              sizes="(max-width:1024px) 90vw, 448px"
            />
          </div>
        </div>
        <div>
          <LioraSectionHeading
            align="start"
            title={t("sobreNosotros.title")}
            script={t("sobreNosotros.titleScript")}
          />
          <p className="mt-6 text-pretty leading-relaxed text-[var(--liora-ink-soft)]">
            {t("sobreNosotros.bodyP1")}
          </p>
          <p className="mt-4 text-pretty leading-relaxed text-[var(--liora-ink-soft)]">
            {t("sobreNosotros.bodyP2")}
          </p>
          <dl className="mt-10 grid gap-6 sm:grid-cols-3">
            {PILLARS.map(({ key, Icon }) => (
              <div key={key}>
                <span className="liora-badge">
                  <Icon className="h-5 w-5" aria-hidden strokeWidth={1.5} />
                </span>
                <dt className="mt-3 font-[family-name:var(--font-liora-display)] text-lg text-[var(--liora-ink)]">
                  {t(`sobreNosotros.${key}.title`)}
                </dt>
                <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-[var(--liora-ink-soft)] md:text-sm">
                  {t(`sobreNosotros.${key}.body`)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
