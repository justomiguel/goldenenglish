import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { SignOutButton } from "@/components/molecules/SignOutButton";

interface LandingHeaderProps {
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  sessionEmail: string | null;
}

export function LandingHeader({
  brand,
  dict,
  locale,
  sessionEmail,
}: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/80 bg-[var(--color-surface)]/90 shadow-[var(--shadow-soft)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[var(--layout-max-width)] items-center justify-between gap-4 px-4 py-3.5">
        <Link
          href={`/${locale}`}
          className="group flex items-center gap-3 rounded-[var(--layout-border-radius)] outline-none ring-[var(--color-primary)] transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Image
            src={brand.logoPath}
            alt={brand.logoAlt || brand.name}
            width={48}
            height={48}
            className="rounded-[var(--layout-border-radius)] shadow-sm ring-1 ring-[var(--color-border)] transition group-hover:ring-[var(--color-accent)]/50"
            priority
          />
          <span className="font-display text-lg font-semibold tracking-tight text-[var(--color-primary)]">
            {brand.name}
          </span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4 md:text-sm">
          <nav
            aria-label={dict.nav.sectionsAria}
            className="flex flex-wrap items-center gap-1 rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/35 px-2 py-1 sm:gap-0 sm:px-3"
          >
            <span className="hidden pr-2 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] sm:inline">
              {dict.nav.sectionsKicker}
            </span>
            <a
              href={`/${locale}#historia`}
              className="rounded-[var(--layout-border-radius)] px-2.5 py-1.5 text-[var(--color-foreground)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
            >
              {dict.nav.about}
            </a>
            <a
              href={`/${locale}#modalidades`}
              className="rounded-[var(--layout-border-radius)] px-2.5 py-1.5 text-[var(--color-foreground)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
            >
              {dict.nav.modalities}
            </a>
            <a
              href={`/${locale}#niveles`}
              className="hidden rounded-[var(--layout-border-radius)] px-2.5 py-1.5 text-[var(--color-foreground)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] sm:inline"
            >
              {dict.nav.courses}
            </a>
          </nav>
          <span
            aria-hidden
            className="hidden h-8 w-px shrink-0 bg-[var(--color-border)] sm:block"
          />
          <nav
            aria-label={dict.nav.accountAria}
            className="flex flex-wrap items-center gap-2 sm:gap-3"
          >
            <LanguageSwitcher locale={locale} labels={dict.common.locale} />
            {sessionEmail ? (
              <div className="flex max-w-full items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)]/80 bg-[var(--color-surface)] px-2 py-1 shadow-sm sm:px-3">
                <span
                  className="hidden max-w-[10rem] truncate text-sm text-[var(--color-muted-foreground)] md:inline"
                  title={sessionEmail}
                >
                  {sessionEmail}
                </span>
                <SignOutButton
                  locale={locale}
                  label={dict.nav.logout}
                  className="rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-muted)] active:scale-[0.98] sm:px-4"
                />
              </div>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 font-medium text-[var(--color-primary-foreground)] shadow-md transition hover:bg-[var(--color-primary-dark)] active:scale-[0.98]"
              >
                <LogIn
                  className="h-4 w-4 opacity-90"
                  aria-hidden
                  strokeWidth={1.75}
                />
                {dict.nav.login}
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
