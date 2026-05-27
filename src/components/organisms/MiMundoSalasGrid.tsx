import Image from "next/image";
import type { CSSProperties } from "react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { mimundoSectionImageSrc } from "@/lib/landing/mimundoLandingImages";
import { MiMundoFloatingDoodles } from "@/components/molecules/MiMundoFloatingDoodles";

interface MiMundoSalasGridProps {
  dict: Dictionary;
}

/**
 * Per-sala accent + a distinct washi tape colour. The washi piece is the
 * decorative tape pinned to the top of each card (scrapbook look). Different
 * `washi` per sala avoids monotony; `tilt` adds slight tape rotation so they
 * don't all line up.
 */
const SALAS = [
  { key: "bebes", file: "burbujas.jpg", accent: "var(--mm-blue)",   emoji: "🫧", washi: "var(--mm-pink)",        tilt: "-6deg" },
  { key: "sala1", file: "hormiguitas.jpg", accent: "var(--mm-green)", emoji: "🐜", washi: "var(--mm-yellow)",     tilt: "4deg" },
  { key: "sala2", file: "mariposas.jpg",  accent: "var(--mm-pink)",  emoji: "🦋", washi: "var(--mm-blue)",       tilt: "-3deg" },
  { key: "sala3", file: "sol.jpg",        accent: "var(--mm-yellow)", emoji: "☀️", washi: "var(--mm-violet)",     tilt: "5deg" },
  { key: "sala4", file: "luna.jpg",       accent: "var(--mm-violet)", emoji: "🌙", washi: "var(--mm-green)",      tilt: "-4deg" },
  { key: "sala5", file: "estrellas.jpg",  accent: "var(--mm-red)",   emoji: "⭐", washi: "var(--mm-yellow-deep, #f5b800)", tilt: "6deg" },
] as const;

export function MiMundoSalasGrid({ dict }: MiMundoSalasGridProps) {
  const t = (path: string) => marketingLandingCopy(dict, "mm", path);

  return (
    <section
      id="salas"
      className="mm-section-paper mm-section-decorated scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-20"
    >
      {/* Decorative watercolor blobs behind the grid */}
      <span className="mm-section-blob mm-section-blob--pink" style={{ inset: "10% auto auto -6%", width: "320px", height: "320px" }} aria-hidden />
      <span className="mm-section-blob mm-section-blob--blue" style={{ inset: "auto -8% 12% auto", width: "360px", height: "360px" }} aria-hidden />
      <MiMundoFloatingDoodles />
      <div className="flex flex-col items-center text-center">
        <span className="mm-section-label mm-section-label--pink">
          {t("salas.kicker")}
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-mm-display)] text-3xl font-bold text-[var(--mm-green)] md:text-4xl">
          {t("salas.sectionTitle")}
        </h2>
        <svg
          className="mm-scribble-underline mx-auto"
          viewBox="0 0 220 14"
          fill="none"
          aria-hidden
        >
          <path
            d="M 4 8 C 36 2, 64 12, 96 6 S 160 12, 216 4"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <ul className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SALAS.map(({ key, file, accent, emoji, washi, tilt }, idx) => {
          const name = t(`salas.${key}.nombre`);
          const ages = t(`salas.${key}.edades`);
          const body = t(`salas.${key}.descripcion`);
          return (
            <li
              key={key}
              className="mm-sala-card mm-card-lift mm-card-bob mm-washi mm-fade-in-up"
              style={
                {
                  "--stagger": idx,
                  "--mm-sala-color": accent,
                  "--mm-washi-color": washi,
                  "--mm-washi-rotate": tilt,
                } as CSSProperties
              }
              data-mm-observe
            >
              <div className="relative aspect-[3/2] w-full overflow-hidden">
                <div className="mm-sala-stripe" aria-hidden />
                <Image
                  src={mimundoSectionImageSrc("modalidades", file)}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-5">
                <span className="mm-sala-badge">
                  <span className="mm-sala-dot" aria-hidden />
                  <span aria-hidden>{emoji}</span>
                  {ages}
                </span>
                <h3 className="mt-3 font-[family-name:var(--font-mm-display)] text-xl font-bold text-[var(--mm-green)]">
                  {name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mm-ink-deep)]">{body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
