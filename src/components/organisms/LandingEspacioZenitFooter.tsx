import Link from "next/link";
import { Camera, Mail, Phone, Share2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { BrandPublic } from "@/lib/brand/server";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { PublicContactForm } from "@/components/molecules/PublicContactForm";

export interface LandingEspacioZenitFooterProps {
  dict: Dictionary;
  locale: string;
  logoSrc: string;
  logoAlt: string;
  brand: BrandPublic;
}

const ICON = 1.6;

export function LandingEspacioZenitFooter({
  dict,
  locale,
  logoSrc,
  logoAlt,
  brand,
}: LandingEspacioZenitFooterProps) {
  const ez = dict.landing.ez;
  const ig = ez.contact.instagramUrl.trim();
  const fb = ez.contact.facebookUrl.trim();
  const footerCta = marketingLandingCopy(dict, "ez", "footerCta").trim();

  return (
    <footer
      id="contacto"
      className="relative z-[11] scroll-mt-[max(6rem,env(safe-area-inset-top)+5rem)] border-t border-[rgb(0_174_239_/25%)] bg-black px-[max(1rem,env(safe-area-inset-left))] pb-[max(2rem,env(safe-area-inset-bottom))] pt-14 text-white lg:px-6"
    >
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3 md:gap-8 lg:gap-12">
        <div className="space-y-5 md:border-e md:border-white/10 md:pe-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--ez-cyan)]">
            {ez.footer.followTitle}
          </p>
          <p className="text-sm font-semibold text-white/88">{ez.footer.socialHandle}</p>
          <div className="flex flex-wrap gap-3">
            {ig ? (
              <Link
                href={ig}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/25 bg-white/8 text-white transition hover:border-[var(--ez-cyan)] hover:text-[var(--ez-cyan)]"
                aria-label={ez.contact.instagramTitle}
              >
                <Camera className="h-5 w-5" aria-hidden strokeWidth={ICON} />
              </Link>
            ) : null}
            {fb ? (
              <Link
                href={fb}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/25 bg-white/8 text-white transition hover:border-[var(--ez-cyan)] hover:text-[var(--ez-cyan)]"
                aria-label={ez.contact.facebookAria}
              >
                <Share2 className="h-5 w-5" aria-hidden strokeWidth={ICON} />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-center justify-start gap-4 text-center md:border-e md:border-white/10 md:px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={logoAlt}
            width={96}
            height={96}
            decoding="async"
            className="h-24 w-24 rounded-full border-[3px] border-[var(--ez-cyan)] bg-black object-contain p-2"
          />
          <p className="max-w-xs text-xs uppercase tracking-[0.18em] text-white/55">
            {brand.tagline}
          </p>
        </div>

        <div className="space-y-5 md:ps-4">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--ez-cyan)]">
            {ez.footer.contactTitle}
          </p>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ez-cyan)]" aria-hidden strokeWidth={ICON} />
              <span className="text-white/88">{ez.contact.phoneDisplay}</span>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ez-cyan)]" aria-hidden strokeWidth={ICON} />
              {brand.contactEmail.trim() ? (
                <Link
                  href={`mailto:${brand.contactEmail.trim()}`}
                  className="break-all text-[var(--ez-cyan-soft)] underline-offset-4 hover:underline"
                >
                  {brand.contactEmail.trim()}
                </Link>
              ) : (
                <span className="break-all text-white/62">{ez.contact.emailPlaceholder}</span>
              )}
            </li>
          </ul>
          <Link
            href={`/${locale}/login`}
            className="inline-flex text-xs font-semibold uppercase tracking-[0.14em] text-white/55 hover:text-[var(--ez-cyan)]"
          >
            {dict.nav.login}
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-12 w-full max-w-lg border-t border-white/15 px-4 pt-12 lg:mt-14">
        <h2 className="text-center text-lg font-semibold text-[var(--ez-cyan-soft)]">
          {dict.publicContact.title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/78">{dict.publicContact.lead}</p>
        <div className="mt-8 rounded-[var(--layout-border-radius)] border border-white/22 bg-[var(--color-surface)] p-6 text-[var(--color-foreground)] shadow-[0_12px_40px_rgb(0_0_0_/45%)] md:p-8">
          <PublicContactForm locale={locale} labels={dict.publicContact} embedded />
        </div>
      </div>
      {footerCta ? (
        <p className="mx-auto mt-12 max-w-2xl px-4 text-center text-sm font-semibold leading-relaxed text-[var(--ez-cyan-soft)] md:text-base lg:px-6">
          {footerCta}
        </p>
      ) : null}
      <div className="mx-auto mt-10 flex max-w-6xl justify-center lg:mt-12">
        <LanguageSwitcher
          locale={locale}
          labels={dict.common.locale}
          variant="compactDark"
        />
      </div>
      <p className="mx-auto mt-6 max-w-6xl border-t border-white/10 pt-8 text-center text-[11px] text-neutral-400">
        © {new Date().getFullYear()} {brand.legalName || brand.name}.{" "}
        {marketingLandingCopy(dict, "ez", "footer.rightsLine")}
      </p>
    </footer>
  );
}
