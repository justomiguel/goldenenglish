"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { MiMundoHero } from "@/components/organisms/MiMundoHero";
import { MiMundoSalasGrid } from "@/components/organisms/MiMundoSalasGrid";
import { MiMundoLandingGallery } from "@/components/organisms/MiMundoLandingGallery";
import { MiMundoLandingContactPanel } from "@/components/organisms/MiMundoLandingContactPanel";
import { MiMundoFloatingDoodles } from "@/components/molecules/MiMundoFloatingDoodles";
import { MiMundoCursorTrail } from "@/components/molecules/MiMundoCursorTrail";
import { MiMundoPropuestaSection } from "@/components/organisms/MiMundoPropuestaSection";
import { MiMundoInstitucionalSection } from "@/components/organisms/MiMundoInstitucionalSection";
import { MiMundoColoniaSection } from "@/components/organisms/MiMundoColoniaSection";

interface LandingMimundoSectionsProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  mediaMap?: LandingMediaMap;
}

export function LandingMimundoSections({
  dict,
  brand,
  locale,
  mediaMap,
}: LandingMimundoSectionsProps) {
  const t = (path: string) => marketingLandingCopy(dict, "mm", path);

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
      {/* Cursor estela — fixed full-viewport layer; gated by pointer:fine +
          prefers-reduced-motion inside the component, so noop on touch. */}
      <MiMundoCursorTrail />

      <MiMundoHero
        dict={dict}
        locale={locale}
        logoPath={brand.logoPath}
        logoAlt={brand.logoAlt}
      />

      {/* Hand-drawn wavy divider hero → cream (sits at top of next section, paints cream curve over hero) */}
      <div className="relative" aria-hidden>
        <svg
          className="mm-divider-wavy absolute inset-x-0 -top-[55px] block text-[var(--mm-cream)]"
          viewBox="0 0 1200 56"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 56 C 200 12, 400 56, 600 28 S 1000 4, 1200 36 L 1200 56 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <MiMundoInstitucionalSection dict={dict} mediaMap={mediaMap} />
      <MiMundoColoniaSection dict={dict} locale={locale} mediaMap={mediaMap} />

      <MiMundoPropuestaSection dict={dict} mediaMap={mediaMap} />

      <MiMundoSalasGrid dict={dict} />
      <MiMundoLandingGallery dict={dict} />

      {/* CTA */}
      <section
        id="cta"
        className="mm-section-green mm-section-decorated relative scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-14 pb-[max(3rem,env(safe-area-inset-bottom))] pe-[max(1.5rem,env(safe-area-inset-right))] text-center md:py-16"
      >
        {/* Floating doodles drift over the green band for extra playfulness */}
        <MiMundoFloatingDoodles count={6} />
        {/* Decorative confetti rising in the CTA band */}
        <div className="mm-cta-confetti mm-confetti-layer" aria-hidden>
          {[
            { left: "8%", color: "var(--mm-yellow)", delay: "-1s" },
            { left: "22%", color: "var(--mm-pink)", delay: "-4s" },
            { left: "38%", color: "var(--mm-blue)", delay: "-7s" },
            { left: "55%", color: "var(--mm-violet)", delay: "-2s" },
            { left: "72%", color: "var(--mm-yellow-deep)", delay: "-5s" },
            { left: "88%", color: "var(--mm-pink)", delay: "-9s" },
          ].map((c, i) => (
            <span
              key={i}
              className="mm-confetti"
              style={{
                left: c.left,
                background: c.color,
                animationDelay: c.delay,
              }}
              aria-hidden
            />
          ))}
        </div>

        <div className="relative z-[1]">
          <h2 className="font-[family-name:var(--font-mm-display)] text-2xl font-bold text-white md:text-3xl lg:text-4xl">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/95 md:text-base">{t("cta.subtitle")}</p>
          <Link
            href={`/${locale}/register`}
            className="mm-cta-sticker-large mt-8"
          >
            <Sparkles className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2.4} />
            {t("cta.button")}
          </Link>
          <MiMundoLandingContactPanel dict={dict} locale={locale} />
        </div>
      </section>

      {/* Footer */}
      <footer className="mm-footer px-[max(1.5rem,env(safe-area-inset-left))] py-14 pb-[max(2rem,env(safe-area-inset-bottom))] pe-[max(1.5rem,env(safe-area-inset-right))] md:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3 md:gap-12">
          <div className="flex flex-col items-start gap-4">
            {brand.logoPath && (
              <div className="mm-logo-chip">
                <Image
                  src={brand.logoPath}
                  alt={brand.logoAlt}
                  width={220}
                  height={130}
                  className="h-20 w-auto max-w-[220px] object-contain"
                />
              </div>
            )}
            <p className="font-[family-name:var(--font-mm-accent)] text-base leading-relaxed text-neutral-200">{t("hero.subtitle")}</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wide text-neutral-100">{t("nav.inicio")}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {(["inicio", "institucional", "colonia", "propuesta", "salas", "galeria", "contacto"] as const).map((key) => (
                <li key={key}>
                  <Link
                    href={`/${locale}#${key === "inicio" ? "top" : key}`}
                    className="mm-link-bounce text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white"
                  >
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
              <a href={`mailto:${t("contact.email")}`} className="mm-link-bounce mt-1 block text-white/80 hover:text-white">
                {t("contact.email")}
              </a>
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
