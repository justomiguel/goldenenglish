"use client";

import Link from "next/link";
import { LogIn, Mail, MessageSquare, Phone } from "lucide-react";
import { BrandFacebookIcon, BrandInstagramIcon } from "@/components/atoms/BrandSocialIcons";
import type { Dictionary } from "@/types/i18n";
import type { BrandPublic } from "@/lib/brand/server";
import type { MarketingLandingBrand } from "@/lib/landing/mzLandingCopy";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { SignOutButton } from "@/components/molecules/SignOutButton";

interface LandingFooterPwaProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
  marketingFullBleedShell?: boolean;
  marketingLandingFooterBrand?: MarketingLandingBrand;
}

/* Primary CTA — solid accent on primary-dark: validated WCAG AA in 124_site_themes_accessible_contrast. */
const primaryBtnClass =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-foreground)] shadow-[0_6px_24px_-12px_rgb(0_0_0_/55%)] transition active:scale-[0.99] active:brightness-95";

/* Secondary CTAs — bright surface tint w/ readable border and full-opacity text */
const secondaryBtnClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-white/40 bg-white/10 px-4 text-sm font-medium text-white transition active:bg-white/18";

const stroke = 1.75;

export function LandingFooterPwa({
  dict,
  brand,
  locale,
  sessionEmail,
  marketingFullBleedShell = false,
  marketingLandingFooterBrand,
}: LandingFooterPwaProps) {
  const footerCta =
    marketingFullBleedShell && marketingLandingFooterBrand
      ? marketingLandingCopy(
          dict,
          marketingLandingFooterBrand,
          "footerCta",
        ).trim() || dict.landing.footerCta
      : dict.landing.footerCta;

  return (
    <footer
      className="relative border-t border-[var(--color-primary-dark)] bg-[var(--color-primary-dark)] px-4 pt-10 text-[var(--color-primary-foreground)]"
      style={{
        paddingBottom: "max(2.25rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-secondary)] via-[var(--color-accent)] to-[var(--color-primary)]"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-[var(--layout-max-width)]">
        <p className="font-display text-balance text-center text-lg font-semibold text-[var(--color-accent)]">
          {footerCta}
        </p>
        <p className="mt-3 text-center text-sm font-medium text-white">
          {brand.legalName}
        </p>
        {brand.contactPhone ? (
          <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-[0.8125rem] text-neutral-200">
            <Phone className="h-3.5 w-3.5 opacity-90" aria-hidden strokeWidth={stroke} />
            <a
              href={`tel:${brand.contactPhone.replace(/\s+/g, "")}`}
              className="underline-offset-2 hover:underline"
            >
              {brand.contactPhone}
            </a>
          </p>
        ) : null}

        {/* Primary CTA — most prominent action */}
        <div className="mt-6">
          {sessionEmail ? (
            <SignOutButton
              locale={locale}
              label={dict.nav.logout}
              className={primaryBtnClass}
            />
          ) : (
            <Link href={`/${locale}/login`} className={primaryBtnClass}>
              <LogIn className="h-4 w-4" aria-hidden strokeWidth={stroke} />
              {dict.nav.login}
            </Link>
          )}
        </div>

        {/* Secondary actions — contact + social, grouped on its own surface */}
        <div className="mt-3 flex flex-col gap-2 rounded-[var(--layout-border-radius)] border border-white/15 bg-white/[0.04] p-2.5">
          <Link href={`/${locale}#contacto`} className={secondaryBtnClass}>
            <MessageSquare
              className="h-4 w-4 opacity-95"
              aria-hidden
              strokeWidth={stroke}
            />
            {dict.publicContact.footerCta}
          </Link>
          {brand.socialInstagram ? (
            <a
              href={brand.socialInstagram}
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryBtnClass}
            >
              <BrandInstagramIcon className="h-4 w-4 shrink-0 opacity-95" />
              Instagram
            </a>
          ) : null}
          {brand.socialFacebook ? (
            <a
              href={brand.socialFacebook}
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryBtnClass}
            >
              <BrandFacebookIcon className="h-4 w-4 shrink-0 opacity-95" />
              Facebook
            </a>
          ) : null}
          {brand.contactEmail ? (
            <a href={`mailto:${brand.contactEmail}`} className={secondaryBtnClass}>
              <Mail
                className="h-4 w-4 opacity-95"
                aria-hidden
                strokeWidth={stroke}
              />
              <span className="truncate">{brand.contactEmail}</span>
            </a>
          ) : null}
        </div>

        <div className="mt-6 flex justify-center border-t border-white/15 pt-5">
          <LanguageSwitcher
            locale={locale}
            labels={dict.common.locale}
            variant="compactDark"
          />
        </div>
      </div>
    </footer>
  );
}
