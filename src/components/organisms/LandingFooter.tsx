import Link from "next/link";
import { ExternalLink, LogIn, Mail } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { BrandPublic } from "@/lib/brand/server";
import { SignOutButton } from "@/components/molecules/SignOutButton";

interface LandingFooterProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
}

const linkClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm transition hover:border-[var(--color-accent)]/60 hover:bg-white/10";

const stroke = 1.75;

export function LandingFooter({
  dict,
  brand,
  locale,
  sessionEmail,
}: LandingFooterProps) {
  return (
    <footer className="relative border-t border-[var(--color-primary-dark)] bg-[var(--color-primary-dark)] py-14 text-[var(--color-primary-foreground)]">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-secondary)] via-[var(--color-accent)] to-[var(--color-primary)]"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-[var(--layout-max-width)] px-4 text-center">
        <p className="font-display text-balance text-xl font-semibold text-[var(--color-accent)] md:text-2xl">
          {dict.landing.footerCta}
        </p>
        <p className="mt-4 text-sm text-white/75">{brand.legalName}</p>
        {brand.contactPhone ? (
          <p className="mt-2 text-sm text-white/60">{brand.contactPhone}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {sessionEmail ? (
            <SignOutButton
              locale={locale}
              label={dict.nav.logout}
              className={linkClass}
            />
          ) : (
            <Link href={`/${locale}/login`} className={linkClass}>
              <LogIn
                className="h-3.5 w-3.5 opacity-90"
                aria-hidden
                strokeWidth={stroke}
              />
              {dict.nav.login}
            </Link>
          )}
          {brand.socialInstagram ? (
            <a
              href={brand.socialInstagram}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              <ExternalLink className="h-3.5 w-3.5 opacity-90" aria-hidden strokeWidth={stroke} />
              Instagram
            </a>
          ) : null}
          {brand.socialFacebook ? (
            <a
              href={brand.socialFacebook}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              <ExternalLink className="h-3.5 w-3.5 opacity-90" aria-hidden strokeWidth={stroke} />
              Facebook
            </a>
          ) : null}
          {brand.contactEmail ? (
            <a href={`mailto:${brand.contactEmail}`} className={linkClass}>
              <Mail className="h-3.5 w-3.5 opacity-90" aria-hidden strokeWidth={stroke} />
              {brand.contactEmail}
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
