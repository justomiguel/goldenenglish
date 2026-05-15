"use client";

import Link from "next/link";
import { ExternalLink, LogIn, Mail, MessageSquare } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { BrandPublic } from "@/lib/brand/server";
import type { MarketingLandingBrand } from "@/lib/landing/mzLandingCopy";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { SignOutButton } from "@/components/molecules/SignOutButton";

interface LandingFooterPwaProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
  marketingFullBleedShell?: boolean;
  marketingLandingFooterBrand?: MarketingLandingBrand;
}

const btnClass =
  "flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-white/25 px-4 text-sm font-semibold transition active:bg-white/15";

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
      ? marketingLandingCopy(dict, marketingLandingFooterBrand, "footerCta").trim() ||
        dict.landing.footerCta
      : dict.landing.footerCta;
  return (
    <footer className="relative border-t border-[var(--color-primary-dark)] bg-[var(--color-primary-dark)] px-3 pb-[max(2.25rem,env(safe-area-inset-bottom,0px))] pt-10 text-[var(--color-primary-foreground)]">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-secondary)] via-[var(--color-accent)] to-[var(--color-primary)]"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-[var(--layout-max-width)]">
        <p className="font-display text-balance text-center text-lg font-semibold text-[var(--color-accent)]">
          {footerCta}
        </p>
        <p className="mt-3 text-center text-xs text-neutral-200">{brand.legalName}</p>
        {brand.contactPhone ? (
          <p className="mt-1 text-center text-xs text-neutral-300">{brand.contactPhone}</p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2">
          {sessionEmail ? (
            <SignOutButton
              locale={locale}
              label={dict.nav.logout}
              className={btnClass}
            />
          ) : (
            <Link href={`/${locale}/login`} className={btnClass}>
              <LogIn
                className="h-4 w-4 opacity-90"
                aria-hidden
                strokeWidth={stroke}
              />
              {dict.nav.login}
            </Link>
          )}
          <Link href={`/${locale}#contacto`} className={btnClass}>
            <MessageSquare className="h-4 w-4 opacity-90" aria-hidden strokeWidth={stroke} />
            {dict.publicContact.footerCta}
          </Link>
          {brand.socialInstagram ? (
            <a
              href={brand.socialInstagram}
              target="_blank"
              rel="noopener noreferrer"
              className={btnClass}
            >
              <ExternalLink className="h-4 w-4 opacity-90" aria-hidden strokeWidth={stroke} />
              Instagram
            </a>
          ) : null}
          {brand.socialFacebook ? (
            <a
              href={brand.socialFacebook}
              target="_blank"
              rel="noopener noreferrer"
              className={btnClass}
            >
              <ExternalLink className="h-4 w-4 opacity-90" aria-hidden strokeWidth={stroke} />
              Facebook
            </a>
          ) : null}
          {brand.contactEmail ? (
            <a href={`mailto:${brand.contactEmail}`} className={btnClass}>
              <Mail className="h-4 w-4 opacity-90" aria-hidden strokeWidth={stroke} />
              {brand.contactEmail}
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
