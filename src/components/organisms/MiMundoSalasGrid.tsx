import Image from "next/image";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { mimundoSectionImageSrc } from "@/lib/landing/mimundoLandingImages";

interface MiMundoSalasGridProps {
  dict: Dictionary;
}

const SALAS = [
  { key: "bebes", file: "burbujas.jpg", accent: "var(--mm-blue)" },
  { key: "sala1", file: "hormiguitas.jpg", accent: "var(--mm-green)" },
  { key: "sala2", file: "mariposas.jpg", accent: "var(--mm-pink)" },
  { key: "sala3", file: "sol.jpg", accent: "var(--mm-yellow)" },
  { key: "sala4", file: "luna.jpg", accent: "var(--mm-violet)" },
  { key: "sala5", file: "estrellas.jpg", accent: "var(--mm-red)" },
] as const;

export function MiMundoSalasGrid({ dict }: MiMundoSalasGridProps) {
  const t = (path: string) => marketingLandingCopy(dict, "mm", path);

  return (
    <section
      id="salas"
      className="mm-section-paper scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-20"
    >
      <h2 className="text-center font-[family-name:var(--font-mm-display)] text-3xl font-bold text-[var(--mm-green)] md:text-4xl">
        {t("salas.sectionTitle")}
      </h2>
      <ul className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SALAS.map(({ key, file, accent }, idx) => {
          const name = t(`salas.${key}.nombre`);
          const ages = t(`salas.${key}.edades`);
          const body = t(`salas.${key}.descripcion`);
          return (
            <li
              key={key}
              className="mm-sala-card mm-card-lift mm-fade-in-up"
              style={{ "--stagger": idx } as React.CSSProperties}
              data-mm-observe
            >
              <div className="relative aspect-[3/2] w-full overflow-hidden">
                <Image
                  src={mimundoSectionImageSrc("modalidades", file)}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-5">
                <span
                  className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white"
                  style={{ backgroundColor: accent }}
                >
                  {ages}
                </span>
                <h3 className="mt-3 font-[family-name:var(--font-mm-display)] text-xl font-bold text-[var(--mm-green)]">
                  {name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mm-ink)]/80">{body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
