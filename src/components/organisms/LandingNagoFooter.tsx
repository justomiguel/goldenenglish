import Link from "next/link";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";

interface LandingNagoFooterProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  t: (path: string) => string;
}

export function LandingNagoFooter({ dict, brand, locale, t }: LandingNagoFooterProps) {
  return (
    <footer className="bg-[var(--nago-footer)] px-[max(1.5rem,env(safe-area-inset-left))] py-14 pb-[max(2rem,env(safe-area-inset-bottom))] pe-[max(1.5rem,env(safe-area-inset-right))] text-white md:py-16">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3 md:gap-12">
        <div className="flex flex-col items-start gap-4">
          {brand.logoPath ? (
            <div className="inline-flex rounded-[var(--layout-border-radius)] bg-white px-3 py-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.logoPath}
                alt={brand.logoAlt}
                className="h-12 w-auto max-w-[140px] object-contain"
              />
            </div>
          ) : null}
          <p className="text-sm leading-relaxed text-neutral-200">{t("hero.tagline")}</p>
        </div>

        <div>
          <p className="font-bold uppercase tracking-wide">{t("footer.enlacesTitle")}</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href={`/${locale}#top`} className="text-white/90 underline decoration-white/40 underline-offset-2 hover:text-white">
                {t("nav.inicio")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}#sobre`} className="text-white/90 underline decoration-white/40 underline-offset-2 hover:text-white">
                {t("nav.sobreNosotros")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}#principios`} className="text-white/90 underline decoration-white/40 underline-offset-2 hover:text-white">
                {t("nav.clases")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}#galeria`} className="text-white/90 underline decoration-white/40 underline-offset-2 hover:text-white">
                {t("nav.galeria")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/events`} className="text-white/90 underline decoration-white/40 underline-offset-2 hover:text-white">
                {t("nav.eventos")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}#contacto`} className="text-white/90 underline decoration-white/40 underline-offset-2 hover:text-white">
                {t("nav.contacto")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-bold uppercase tracking-wide">{t("footer.siguenos")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {t("contact.facebookUrl").trim() ? (
              <a href={t("contact.facebookUrl")} className="nago-social-icon" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <span className="text-xs font-bold" aria-hidden>f</span>
              </a>
            ) : null}
            {t("contact.instagramUrl").trim() ? (
              <a href={t("contact.instagramUrl")} className="nago-social-icon" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <span className="text-[10px] font-bold" aria-hidden>IG</span>
              </a>
            ) : null}
            {t("contact.whatsappUrl").trim() ? (
              <a href={t("contact.whatsappUrl")} className="nago-social-icon" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <span className="text-[10px] font-bold" aria-hidden>WA</span>
              </a>
            ) : null}
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
