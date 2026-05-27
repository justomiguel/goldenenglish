import Image from "next/image";
import type { CSSProperties } from "react";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { mimundoSectionImageSrc } from "@/lib/landing/mimundoLandingImages";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import { MiMundoFloatingDoodles } from "@/components/molecules/MiMundoFloatingDoodles";

interface MiMundoPropuestaSectionProps {
  dict: Dictionary;
  mediaMap?: LandingMediaMap;
}

/**
 * Each pillar gets a distinct washi tape colour + slight tilt so the row reads
 * as a hand-glued scrapbook page rather than a uniform grid. `--mm-washi-*`
 * CSS variables feed the .mm-washi pseudo-element defined in mimundoLanding.css.
 */
const PILARES = [
  { key: "juego",      file: "juego.jpg",      color: "var(--mm-green)",       washi: "var(--mm-pink)",   tilt: "-5deg" },
  { key: "arte",       file: "arte.jpg",       color: "var(--mm-pink)",        washi: "var(--mm-yellow)", tilt: "4deg" },
  { key: "naturaleza", file: "naturaleza.jpg", color: "var(--mm-green-light)", washi: "var(--mm-blue)",   tilt: "-3deg" },
  { key: "musica",     file: "musica.jpg",     color: "var(--mm-violet)",      washi: "var(--mm-green)",  tilt: "6deg" },
  { key: "lectura",    file: "lectura.jpg",    color: "var(--mm-blue)",        washi: "var(--mm-pink)",   tilt: "-4deg" },
] as const;

export function MiMundoPropuestaSection({ dict, mediaMap }: MiMundoPropuestaSectionProps) {
  const t = (path: string) => marketingLandingCopy(dict, "mm", path);
  const img = (section: "inicio" | "historia" | "modalidades" | "oferta", file: string) =>
    resolveLandingImageSrcForTheme("mimundo", section, file, mediaMap) ||
    mimundoSectionImageSrc(section, file);

  return (
    <section
      id="propuesta"
      className="mm-section-cream mm-section-decorated scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-20"
    >
      {/* Soft watercolor blobs + drifting doodles paint the playful backdrop */}
      <span className="mm-section-blob mm-section-blob--yellow" style={{ inset: "8% auto auto -4%", width: "280px", height: "280px" }} aria-hidden />
      <span className="mm-section-blob mm-section-blob--green"  style={{ inset: "auto -6% 8% auto", width: "320px", height: "320px" }} aria-hidden />
      <MiMundoFloatingDoodles />

      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
        <div className="mm-fade-in-up">
          <span className="mm-section-label mm-section-label--green">
            {t("propuesta.sectionLabel")}
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-mm-display)] text-3xl font-bold text-[var(--mm-green)] md:text-4xl">
            {t("propuesta.title")}
          </h2>
          <svg className="mm-scribble-underline" viewBox="0 0 220 14" fill="none" aria-hidden>
            <path d="M 4 8 C 36 2, 64 12, 96 6 S 160 12, 216 4" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
          </svg>
          <p className="mt-5 text-pretty leading-relaxed text-[var(--mm-ink-deep)]">{t("propuesta.bodyP1")}</p>
          <p className="mt-4 text-pretty leading-relaxed text-[var(--mm-ink-deep)]">{t("propuesta.bodyP2")}</p>
        </div>

        <div className="mm-fade-in-up relative flex justify-center md:justify-end">
          <div className="relative h-60 w-60 sm:h-72 sm:w-72">
            {/* Pink watercolor halo hugging the round photo */}
            <span
              className="mm-section-blob mm-section-blob--pink"
              style={{ inset: "-18% -18% -18% -18%", width: "auto", height: "auto", opacity: 0.55 }}
              aria-hidden
            />
            <div className="mm-frame-ring relative h-full w-full">
              <Image
                src={img("historia", "propuesta.jpg")}
                alt=""
                width={288}
                height={288}
                className="relative z-[1] h-full w-full rounded-full object-cover p-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5 pilares — washi tape + bob give a scrapbook composition */}
      <ul className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {PILARES.map(({ key, file, color, washi, tilt }, idx) => (
          <li
            key={key}
            className="mm-pillar-card mm-fade-in-up mm-card-lift mm-card-bob mm-washi flex flex-col items-center gap-3 rounded-2xl bg-white p-4 pt-5 shadow-[var(--mm-shadow-card)]"
            style={
              {
                transitionDelay: `${idx * 0.07}s`,
                "--mm-washi-color": washi,
                "--mm-washi-rotate": tilt,
              } as CSSProperties
            }
            data-mm-observe
          >
            <div className="mm-frame-crayon relative h-20 w-20 overflow-hidden" style={{ borderColor: color }}>
              <Image src={img("oferta", file)} alt="" fill className="object-cover" sizes="80px" />
            </div>
            <h3 className="text-center text-sm font-bold text-[var(--mm-green)]">{t(`pilares.${key}.title`)}</h3>
            <p className="text-center text-xs leading-relaxed text-[var(--mm-ink-deep)]">{t(`pilares.${key}.body`)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
