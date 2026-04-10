"use client";

import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { SignOutButton } from "@/components/molecules/SignOutButton";

interface LandingHeaderPwaProps {
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  sessionEmail: string | null;
}

export function LandingHeaderPwa({
  brand,
  dict,
  locale,
  sessionEmail,
}: LandingHeaderPwaProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/80 bg-[var(--color-surface)]/95 shadow-[var(--shadow-soft)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[var(--layout-max-width)] items-center justify-between gap-2 px-3 py-2">
        <Link
          href={`/${locale}`}
          className="group flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-[var(--layout-border-radius)] py-1 outline-none ring-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Image
            src={brand.logoPath}
            alt={brand.logoAlt || brand.name}
            width={44}
            height={44}
            className="shrink-0 rounded-[var(--layout-border-radius)] shadow-sm ring-1 ring-[var(--color-border)]"
            priority
          />
          <span className="font-display truncate text-base font-semibold tracking-tight text-[var(--color-primary)]">
            {brand.name}
          </span>
        </Link>
        <nav
          aria-label={dict.nav.accountAria}
          className="flex shrink-0 items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)]/70 bg-[var(--color-muted)]/25 px-1.5 py-1"
        >
          <LanguageSwitcher locale={locale} labels={dict.common.locale} />
          {sessionEmail ? (
            <SignOutButton
              locale={locale}
              label={dict.nav.logout}
              iconOnly
              className="min-h-11 min-w-11 shrink-0 rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm active:scale-[0.98]"
            />
          ) : (
            <Link
              href={`/${locale}/login`}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-md active:scale-[0.98]"
              aria-label={dict.nav.login}
            >
              <LogIn className="h-5 w-5" aria-hidden strokeWidth={1.75} />
            </Link>
          )}
        </nav>
      </div>
      <div className="border-t border-[var(--color-border)]/60 bg-[var(--color-muted)]/20">
        <p className="px-3 pt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {dict.nav.sectionsKicker}
        </p>
        <nav
          aria-label={dict.nav.sectionsAria}
          className="flex px-2 pb-1"
        >
          <a
            href={`/${locale}#historia`}
            className="min-h-11 flex-1 rounded-[var(--layout-border-radius)] py-2.5 text-center text-sm font-semibold text-[var(--color-foreground)] active:bg-[var(--color-muted)]/80"
          >
            {dict.nav.about}
          </a>
          <a
            href={`/${locale}#niveles`}
            className="min-h-11 flex-1 rounded-[var(--layout-border-radius)] py-2.5 text-center text-sm font-semibold text-[var(--color-foreground)] active:bg-[var(--color-muted)]/80"
          >
            {dict.nav.courses}
          </a>
        </nav>
      </div>
    </header>
  );
}
