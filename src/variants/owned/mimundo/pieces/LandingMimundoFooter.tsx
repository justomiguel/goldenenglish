"use client";

import Image from "next/image";
import Link from "next/link";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { PUBLIC_MARKETING_CHROME_CLASS } from "@/lib/theme/publicExperienceNav";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";

interface LandingMimundoFooterProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  blogEnabled: boolean;
  merchEnabled: boolean;
}

export function LandingMimundoFooter({
  dict,
  brand,
  locale,
  blogEnabled,
  merchEnabled,
}: LandingMimundoFooterProps) {
  const t = (path: string) => marketingLandingCopy(dict, "mm", path);

  return (
      <footer className={`${PUBLIC_MARKETING_CHROME_CLASS} mm-footer px-[max(1.5rem,env(safe-area-inset-left))] py-14 pb-[max(2rem,env(safe-area-inset-bottom))] pe-[max(1.5rem,env(safe-area-inset-right))] md:py-16`}>
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
              <li>
                <Link
                  href={`/${locale}/events`}
                  className="mm-link-bounce text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white"
                >
                  {dict.events.public.title}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/privacidad`}
                  className="mm-link-bounce text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white"
                >
                  {dict.privacy.footerLink}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/preguntas`}
                  className="mm-link-bounce text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white"
                >
                  {dict.publicAnswers.footerLink}
                </Link>
              </li>
              {blogEnabled ? (
                <li>
                  <Link
                    href={`/${locale}/blog`}
                    className="mm-link-bounce text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white"
                  >
                    {dict.blog.list.title}
                  </Link>
                </li>
              ) : null}
              {merchEnabled ? (
                <li>
                  <Link href={`/${locale}/tienda`} className="mm-link-bounce text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white">
                    {dict.shop.catalog.title}
                  </Link>
                </li>
              ) : null}
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
  );
}
