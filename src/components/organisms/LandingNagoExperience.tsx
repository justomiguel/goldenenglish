import Image from "next/image";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NAGO_TEMPLATE } from "@/lib/landing/nagoTemplateImages";
import { NagoReveal } from "@/components/organisms/NagoReveal";
import {
  NagoIconCultura,
  NagoIconDeporte,
  NagoIconDesarrollo,
  NagoIconDisciplina,
  NagoIconMovimiento,
  NagoIconMusica,
} from "@/components/organisms/NagoLineIcons";

const MARKS = [
  { key: "deporte", Icon: NagoIconDeporte },
  { key: "movimiento", Icon: NagoIconMovimiento },
  { key: "disciplina", Icon: NagoIconDisciplina },
  { key: "musica", Icon: NagoIconMusica },
  { key: "cultura", Icon: NagoIconCultura },
  { key: "desarrollo", Icon: NagoIconDesarrollo },
] as const;

const TILES = [
  NAGO_TEMPLATE.expTl,
  NAGO_TEMPLATE.expTr,
  NAGO_TEMPLATE.expBl,
  NAGO_TEMPLATE.expBr,
] as const;

export function LandingNagoExperience({ dict }: { dict: Dictionary }) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);

  return (
    <section
      id="nago"
      className="nago-section scroll-mt-24 bg-[var(--nago-bg-2)] px-[max(1.25rem,env(safe-area-inset-left))] pe-[max(1.25rem,env(safe-area-inset-right))]"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.15fr)_minmax(0,0.42fr)] lg:items-center">
        <NagoReveal>
          <h2 className="nago-display max-w-xl text-3xl leading-[1.05] text-[var(--nago-heading-solid)] md:text-5xl">
            {t("experiencia.title")}
          </h2>
          <div className="nago-rule-soft mt-4 h-px w-12 bg-[var(--nago-gold)]" aria-hidden />
          <p className="mt-5 max-w-md text-pretty leading-relaxed text-[var(--nago-ink-muted)]">
            {t("experiencia.body")}
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-2">
            {MARKS.map(({ key, Icon }) => (
              <li
                key={key}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--nago-gold)]"
              >
                <Icon className="nago-pillar-icon h-6 w-6" />
                {t(`experiencia.${key}`)}
              </li>
            ))}
          </ul>
        </NagoReveal>
        <NagoReveal variant="media">
          <div className="relative aspect-[4/5] min-h-[16rem] overflow-hidden sm:min-h-[22rem]">
            <Image
              src={NAGO_TEMPLATE.expMain}
              alt=""
              fill
              sizes="(max-width:1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
        </NagoReveal>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {TILES.map((src, i) => (
            <NagoReveal
              key={src}
              variant="media"
              delay={i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined}
            >
              <div className="relative aspect-[4/3] overflow-hidden lg:aspect-[5/4]">
                <Image src={src} alt="" fill sizes="20vw" className="object-cover" />
              </div>
            </NagoReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
