import Image from "next/image";
import Link from "next/link";
import { Heart, Sparkles, Users, Drum } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NagoLandingGallery } from "@/components/organisms/NagoLandingGallery";

interface LandingNagoSectionsProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  mediaMap?: LandingMediaMap;
}

export function LandingNagoSections({
  dict,
  brand,
  locale,
  mediaMap,
}: LandingNagoSectionsProps) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);
  const img = (section: "inicio" | "historia" | "modalidades" | "oferta", file: string) =>
    resolveLandingImageSrcForTheme("nago", section, file, mediaMap);

  const principles = [
    { key: "respeto", Icon: Heart },
    { key: "disciplina", Icon: Sparkles },
    { key: "union", Icon: Users },
    { key: "cultura", Icon: Drum },
  ] as const;

  return (
    <>
      {/* Hero: Brasil flag with capoeirista */}
      <section
        className="nago-hero-bg relative isolate overflow-hidden"
        aria-labelledby="nago-hero-title"
      >
        <div className="nago-hero-overlay" aria-hidden />
        <div className="nago-hero-text-veil" aria-hidden />

        <div className="nago-hero-content relative z-[3] mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-[max(1.5rem,env(safe-area-inset-left))] py-16 sm:py-20 pe-[max(1.5rem,env(safe-area-inset-right))]">
          <h1
            id="nago-hero-title"
            className="nago-hero-title max-w-lg text-balance font-[family-name:var(--font-nago-display)] text-5xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
          >
            {t("hero.title")}
          </h1>
          <p className="nago-hero-subtitle mt-6 max-w-md text-lg font-medium leading-snug text-white md:text-xl">
            {t("hero.subtitle")}
          </p>
        </div>
      </section>

      {/* Sobre Nosotros: beige background */}
      <section
        id="sobre"
        className="nago-section-beige scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-20"
      >
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <h2 className="font-[family-name:var(--font-nago-display)] text-3xl font-bold uppercase tracking-wide text-[var(--nago-green)] md:text-4xl">
              {t("sobreNosotros.title")}
            </h2>
            <p className="mt-5 text-pretty leading-relaxed text-[var(--nago-ink)]/85">
              {t("sobreNosotros.bodyP1")}
            </p>
            <p className="mt-4 text-pretty leading-relaxed text-[var(--nago-ink)]/85">
              {t("sobreNosotros.bodyP2")}
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <div className="relative h-56 w-56 sm:h-64 sm:w-64 md:h-72 md:w-72">
              {/* Green circular frame */}
              <div className="absolute inset-0 rounded-full border-[8px] border-[var(--nago-green)] bg-[var(--nago-green)]/5" />
              <Image
                src={img("historia", "1.png")}
                alt=""
                width={288}
                height={288}
                className="relative z-[1] h-full w-full rounded-full object-cover p-1.5"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Nuestros Principios */}
      <section
        id="principios"
        className="scroll-mt-24 bg-white px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-20"
      >
        <h2 className="text-center font-[family-name:var(--font-nago-display)] text-3xl font-bold uppercase text-[var(--nago-green)] md:text-4xl">
          {t("principios.sectionTitle")}
        </h2>
        <div className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {principles.map(({ key, Icon }) => (
            <div key={key} className="text-center">
              <div className="nago-principle-icon">
                <Icon className="h-14 w-14" aria-hidden strokeWidth={2} />
              </div>
              <h3 className="mt-5 font-[family-name:var(--font-nago-display)] text-lg font-bold uppercase text-[var(--nago-green)]">
                {t(`principios.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--nago-ink)]/80">
                {t(`principios.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <NagoLandingGallery dict={dict} />

      {/* CTA band */}
      <section
        id="cta"
        className="scroll-mt-24 bg-[var(--nago-green)] px-[max(1.5rem,env(safe-area-inset-left))] py-14 pe-[max(1.5rem,env(safe-area-inset-right))] text-center md:py-16"
      >
        <h2 className="font-[family-name:var(--font-nago-display)] text-2xl font-bold uppercase text-[var(--nago-yellow)] md:text-3xl lg:text-4xl">
          {t("cta.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-white/90 md:text-base">
          {t("cta.subtitle")}
        </p>
        <Link
          href={`/${locale}#contacto`}
          className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-full border-2 border-white bg-transparent px-10 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-[var(--nago-green)]"
        >
          {t("cta.button")}
        </Link>
      </section>

      {/* Footer */}
      <footer
        id="contacto"
        className="scroll-mt-24 bg-[var(--nago-footer)] px-[max(1.5rem,env(safe-area-inset-left))] py-14 pb-[max(2rem,env(safe-area-inset-bottom))] pe-[max(1.5rem,env(safe-area-inset-right))] text-white md:py-16"
      >
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3 md:gap-12">
          {/* Brand + tagline */}
          <div className="flex flex-col items-start gap-4">
            {brand.logoPath && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logoPath}
                alt={brand.logoAlt}
                className="h-14 w-auto max-w-[140px] object-contain brightness-0 invert"
              />
            )}
            <p className="text-sm leading-relaxed text-white/70">{t("hero.tagline")}</p>
          </div>

          {/* Enlaces */}
          <div>
            <p className="font-bold uppercase tracking-wide">{t("footer.enlacesTitle")}</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href={`/${locale}#top`} className="text-white/75 underline decoration-white/30 underline-offset-2 hover:text-white">
                  {t("nav.inicio")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#sobre`} className="text-white/75 underline decoration-white/30 underline-offset-2 hover:text-white">
                  {t("nav.sobreNosotros")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#principios`} className="text-white/75 underline decoration-white/30 underline-offset-2 hover:text-white">
                  {t("nav.clases")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#galeria`} className="text-white/75 underline decoration-white/30 underline-offset-2 hover:text-white">
                  {t("nav.galeria")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#cta`} className="text-white/75 underline decoration-white/30 underline-offset-2 hover:text-white">
                  {t("nav.eventos")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#contacto`} className="text-white/75 underline decoration-white/30 underline-offset-2 hover:text-white">
                  {t("nav.contacto")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Síguenos / redes */}
          <div>
            <p className="font-bold uppercase tracking-wide">{t("footer.siguenos")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {t("contact.facebookUrl").trim() ? (
                <a
                  href={t("contact.facebookUrl")}
                  className="nago-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <span className="text-xs font-bold" aria-hidden>f</span>
                </a>
              ) : null}
              {t("contact.instagramUrl").trim() ? (
                <a
                  href={t("contact.instagramUrl")}
                  className="nago-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <span className="text-[10px] font-bold" aria-hidden>IG</span>
                </a>
              ) : null}
              {t("contact.whatsappUrl").trim() ? (
                <a
                  href={t("contact.whatsappUrl")}
                  className="nago-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                >
                  <span className="text-[10px] font-bold" aria-hidden>WA</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <p className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {brand.legalName} — {t("footer.rightsLine")}
        </p>
      </footer>
    </>
  );
}
