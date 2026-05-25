"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { mimundoSectionImageSrc } from "@/lib/landing/mimundoLandingImages";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { MiMundoHero } from "@/components/organisms/MiMundoHero";
import { MiMundoSalasGrid } from "@/components/organisms/MiMundoSalasGrid";
import { MiMundoLandingGallery } from "@/components/organisms/MiMundoLandingGallery";
import { MiMundoLandingContactPanel } from "@/components/organisms/MiMundoLandingContactPanel";

interface LandingMimundoSectionsProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  mediaMap?: LandingMediaMap;
}

const PILARES = [
  { key: "juego", file: "juego.jpg", color: "var(--mm-green)" },
  { key: "arte", file: "arte.jpg", color: "var(--mm-pink)" },
  { key: "naturaleza", file: "naturaleza.jpg", color: "var(--mm-green-light)" },
  { key: "musica", file: "musica.jpg", color: "var(--mm-violet)" },
  { key: "lectura", file: "lectura.jpg", color: "var(--mm-blue)" },
] as const;

export function LandingMimundoSections({
  dict,
  brand,
  locale,
  mediaMap,
}: LandingMimundoSectionsProps) {
  const t = (path: string) => marketingLandingCopy(dict, "mm", path);
  const img = (section: "inicio" | "historia" | "modalidades" | "oferta", file: string) =>
    resolveLandingImageSrcForTheme("mimundo", section, file, mediaMap) ||
    mimundoSectionImageSrc(section, file);

  const sectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !sectionsRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("mm-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    sectionsRef.current.querySelectorAll(".mm-fade-in-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionsRef}>
      <MiMundoHero dict={dict} locale={locale} />

      {/* Propuesta pedagógica */}
      <section
        id="propuesta"
        className="mm-section-cream scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-20"
      >
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <div className="mm-fade-in-up">
            <span className="font-[family-name:var(--font-mm-accent)] text-lg text-[var(--mm-green)]">
              {t("propuesta.sectionLabel")}
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-mm-display)] text-3xl font-bold text-[var(--mm-green)] md:text-4xl">
              {t("propuesta.title")}
            </h2>
            <p className="mt-5 text-pretty leading-relaxed text-[var(--mm-ink)]/85">{t("propuesta.bodyP1")}</p>
            <p className="mt-4 text-pretty leading-relaxed text-[var(--mm-ink)]/85">{t("propuesta.bodyP2")}</p>
          </div>
          <div className="mm-fade-in-up flex justify-center md:justify-end">
            <div className="mm-frame-ring relative h-60 w-60 sm:h-72 sm:w-72">
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

        {/* 5 pilares */}
        <ul className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {PILARES.map(({ key, file, color }, idx) => (
            <li
              key={key}
              className="mm-fade-in-up mm-card-lift flex flex-col items-center gap-3 rounded-2xl bg-white p-4 shadow-[var(--mm-shadow-card)]"
              style={{ transitionDelay: `${idx * 0.07}s` }}
              data-mm-observe
            >
              <div className="mm-frame-crayon relative h-20 w-20 overflow-hidden" style={{ borderColor: color }}>
                <Image
                  src={img("oferta", file)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <h3 className="text-center text-sm font-bold text-[var(--mm-green)]">
                {t(`pilares.${key}.title`)}
              </h3>
              <p className="text-center text-xs leading-relaxed text-[var(--mm-ink)]/75">
                {t(`pilares.${key}.body`)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <MiMundoSalasGrid dict={dict} />
      <MiMundoLandingGallery dict={dict} />

      {/* CTA */}
      <section
        id="cta"
        className="mm-section-green scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-14 pb-[max(3rem,env(safe-area-inset-bottom))] pe-[max(1.5rem,env(safe-area-inset-right))] text-center md:py-16"
      >
        <h2 className="font-[family-name:var(--font-mm-display)] text-2xl font-bold text-white md:text-3xl lg:text-4xl">
          {t("cta.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-white/90 md:text-base">{t("cta.subtitle")}</p>
        <Link
          href={`/${locale}/register`}
          className="mt-8 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold text-[var(--mm-green)] shadow-md transition hover:bg-[var(--mm-cream)]"
        >
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
          {t("cta.button")}
        </Link>
        <MiMundoLandingContactPanel dict={dict} locale={locale} />
      </section>

      {/* Footer */}
      <footer className="mm-footer px-[max(1.5rem,env(safe-area-inset-left))] py-14 pb-[max(2rem,env(safe-area-inset-bottom))] pe-[max(1.5rem,env(safe-area-inset-right))] md:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3 md:gap-12">
          <div className="flex flex-col items-start gap-4">
            {brand.logoPath && (
              <div className="inline-flex rounded-xl bg-white px-3 py-2 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brand.logoPath} alt={brand.logoAlt} className="h-12 w-auto max-w-[140px] object-contain" />
              </div>
            )}
            <p className="font-[family-name:var(--font-mm-accent)] text-base leading-relaxed text-neutral-200">{t("hero.subtitle")}</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wide text-neutral-100">{t("nav.inicio")}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {(["inicio", "propuesta", "salas", "galeria", "contacto"] as const).map((key) => (
                <li key={key}>
                  <Link href={`/${locale}#${key === "inicio" ? "top" : key}`} className="text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white">
                    {t(`nav.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wide text-neutral-100">{t("footer.siguenos")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {brand.socialFacebook?.trim() ? (
                <a href={brand.socialFacebook} className="mm-social-icon" target="_blank" rel="noopener noreferrer" aria-label={t("chrome.facebookAria")}>
                  <span className="text-xs font-bold" aria-hidden>f</span>
                </a>
              ) : null}
              {brand.socialInstagram?.trim() ? (
                <a href={brand.socialInstagram} className="mm-social-icon" target="_blank" rel="noopener noreferrer" aria-label={t("chrome.instagramAria")}>
                  <span className="text-[10px] font-bold" aria-hidden>IG</span>
                </a>
              ) : null}
            </div>
            <div className="mt-5 text-sm text-white/75">
              <p>{t("contact.direccion")}</p>
              <p className="mt-1">{t("contact.telefono")}</p>
              <a href={`mailto:${t("contact.email")}`} className="mt-1 block text-white/80 hover:text-white">{t("contact.email")}</a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl justify-center border-t border-white/10 pt-6">
          <LanguageSwitcher locale={locale} labels={dict.common.locale} variant="compactDark" />
        </div>
        <p className="mx-auto mt-6 max-w-6xl text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} {brand.legalName} — {t("footer.rightsLine")}
        </p>
      </footer>
    </div>
  );
}
