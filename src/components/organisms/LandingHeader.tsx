import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { SignOutButton } from "@/components/molecules/SignOutButton";

interface LandingHeaderProps {
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  sessionEmail: string | null;
  isAdmin?: boolean;
}

export function LandingHeader({
  brand,
  dict,
  locale,
  sessionEmail,
  isAdmin = false,
}: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/80 bg-[var(--color-surface)]/90 shadow-[var(--shadow-soft)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[var(--layout-max-width)] items-center justify-between gap-4 px-4 py-3.5">
        <Link
          href={`/${locale}`}
          className="group flex shrink-0 items-center gap-3 rounded-[var(--layout-border-radius)] outline-none ring-[var(--color-primary)] transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <div className="shrink-0 rounded-[var(--layout-border-radius)] bg-white p-1.5 shadow-sm ring-1 ring-[var(--color-border)] transition group-hover:ring-[var(--color-accent)]/50">
            <Image
              src={brand.logoPath}
              alt={brand.logoAlt || brand.name}
              width={48}
              height={48}
              className="block h-9 w-9 rounded-[var(--layout-border-radius)] object-contain"
              priority
            />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-[var(--color-primary)]">
            {brand.name}
          </span>
        </Link>
        <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-2 sm:gap-3 md:text-sm">
          <nav
            aria-label={dict.nav.sectionsAria}
            className="flex min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/35 px-2 py-1 sm:px-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <span className="hidden pr-2 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] sm:inline">
              {dict.nav.sectionsKicker}
            </span>
            {isAdmin ? (
              <Link
                href={`/${locale}/dashboard/admin`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--layout-border-radius)] border border-[var(--color-accent)]/55 bg-[color-mix(in_srgb,var(--color-accent)_26%,var(--color-surface))] px-2.5 py-1.5 text-sm font-semibold text-[var(--color-accent-foreground)] shadow-sm transition hover:bg-[color-mix(in_srgb,var(--color-accent)_42%,var(--color-surface))] hover:border-[var(--color-accent)]/80"
              >
                <LayoutDashboard
                  className="h-3.5 w-3.5 shrink-0 opacity-95"
                  aria-hidden
                  strokeWidth={2}
                />
                {dict.nav.administration}
              </Link>
            ) : null}
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
              className="shrink-0 rounded-[var(--layout-border-radius)] px-2.5 py-1.5 text-[var(--color-foreground)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
            >
              {dict.nav.courses}
            </a>
            <a
              href={`/${locale}#certificaciones`}
              className="shrink-0 rounded-[var(--layout-border-radius)] px-2.5 py-1.5 text-[var(--color-foreground)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
            >
              {dict.nav.certifications}
            </a>
          </nav>
          <span
            aria-hidden
            className="hidden h-7 w-px shrink-0 bg-[var(--color-border)] lg:block"
          />
          <nav
            aria-label={dict.nav.accountAria}
            className="flex shrink-0 flex-nowrap items-center gap-2 sm:gap-2.5"
          >
            <LanguageSwitcher
              locale={locale}
              labels={dict.common.locale}
              variant="compact"
            />
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
