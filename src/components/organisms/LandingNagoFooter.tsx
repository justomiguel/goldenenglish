import Link from "next/link";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { BrandFacebookIcon, BrandInstagramIcon } from "@/components/atoms/BrandSocialIcons";
import { resolveNagoLogo } from "@/lib/landing/nagoLogo";

interface LandingNagoFooterProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  t: (path: string) => string;
}

function YoutubeGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M23.5 6.2a3 3 0 0 0-2.1-2.2C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.2c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.2A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.8 15.5v-7L16 12l-6.2 3.5Z"
      />
    </svg>
  );
}

export function LandingNagoFooter({ dict, brand, locale, t }: LandingNagoFooterProps) {
  return (
    <footer className="bg-[var(--nago-footer)] px-[max(1.25rem,env(safe-area-inset-left))] py-12 pb-[max(2rem,env(safe-area-inset-bottom))] pe-[max(1.25rem,env(safe-area-inset-right))] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.1fr_1fr_1fr] md:items-start">
        <div className="flex flex-col items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveNagoLogo(brand)}
            alt={brand.logoAlt}
            className="nago-logo-knockout block h-24 w-auto max-w-[16rem] object-contain object-left sm:h-28 sm:max-w-[20rem]"
          />
          <p className="nago-display text-lg text-[var(--nago-heading-solid)]">Capoeira Nagô</p>
          <p className="flex items-center gap-2 text-sm text-[var(--nago-ink-muted)]">
            <span className="nago-br-dot" aria-hidden />
            {t("footer.location")}
            <span className="nago-cl-dot" aria-hidden />
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--nago-gold)]">
            {t("footer.enlacesTitle")}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href={`/${locale}#top`} className="hover:text-[var(--nago-gold)]">
                {t("nav.inicio")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}#clases`} className="hover:text-[var(--nago-gold)]">
                {t("nav.clases")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}#horarios`} className="hover:text-[var(--nago-gold)]">
                {t("nav.horarios")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}#nago`} className="hover:text-[var(--nago-gold)]">
                {t("nav.nago")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/events`} className="hover:text-[var(--nago-gold)]">
                {t("nav.eventos")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}#galeria`} className="hover:text-[var(--nago-gold)]">
                {t("nav.galeria")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}#contacto`} className="hover:text-[var(--nago-gold)]">
                {t("nav.contacto")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/privacidad`} className="hover:text-[var(--nago-gold)]">
                {dict.privacy.footerLink}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--nago-gold)]">
            {t("footer.siguenos")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {t("contact.instagramUrl").trim() ? (
              <a
                href={t("contact.instagramUrl")}
                className="nago-social-icon"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("chrome.instagramAria")}
              >
                <BrandInstagramIcon className="h-4 w-4" />
              </a>
            ) : null}
            {t("contact.youtubeUrl").trim() ? (
              <a
                href={t("contact.youtubeUrl")}
                className="nago-social-icon"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("chrome.youtubeAria")}
              >
                <YoutubeGlyph className="h-4 w-4" />
              </a>
            ) : null}
            {t("contact.facebookUrl").trim() ? (
              <a
                href={t("contact.facebookUrl")}
                className="nago-social-icon"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("chrome.facebookAria")}
              >
                <BrandFacebookIcon className="h-4 w-4" />
              </a>
            ) : null}
            {t("contact.whatsappUrl").trim() ? (
              <a
                href={t("contact.whatsappUrl")}
                className="nago-social-icon"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("chrome.whatsappAria")}
              >
                <span className="text-[10px] font-bold">WA</span>
              </a>
            ) : null}
          </div>
          <p className="mt-5 text-sm text-[var(--nago-ink-muted)]">{t("contact.phoneDisplay")}</p>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
        <LanguageSwitcher locale={locale} labels={dict.common.locale} variant="compactDark" />
        <a
          href={`/${locale}#top`}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-[var(--nago-gold)]"
          aria-label={t("chrome.backToTop")}
        >
          ↑
        </a>
      </div>
      <p className="mx-auto mt-4 max-w-7xl text-xs text-neutral-500">
        © {new Date().getFullYear()} {brand.legalName} — {t("footer.rightsLine")}
      </p>
    </footer>
  );
}
