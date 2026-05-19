import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { SignOutButton } from "@/components/molecules/SignOutButton";

interface LandingGreenfieldHeaderProps {
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  sessionEmail: string | null;
  /** Sin cuenta admin aún: sin botón en barra (evita duplicar el CTA del cuerpo). */
  bootstrapAccountPending?: boolean;
}

export function LandingGreenfieldHeader({
  brand,
  dict,
  locale,
  sessionEmail,
  bootstrapAccountPending = false,
}: LandingGreenfieldHeaderProps) {
  const bypassLogoOptimizer = brand.logoPath.startsWith("/images/");
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/80 bg-[var(--color-surface)]/90 pt-[env(safe-area-inset-top,0px)] shadow-[var(--shadow-soft)] backdrop-blur-md">
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
              unoptimized={bypassLogoOptimizer}
              className="block h-9 w-9 rounded-[var(--layout-border-radius)] object-contain"
              priority
            />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-[var(--color-primary)]">
            {brand.name}
          </span>
        </Link>
        <nav
          aria-label={dict.nav.accountAria}
          className="flex shrink-0 flex-nowrap items-center gap-2 sm:gap-2.5"
        >
          {sessionEmail ? (
            <>
              <Link
                href={`/${locale}/dashboard`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--layout-border-radius)] border border-[var(--color-accent)]/55 bg-[color-mix(in_srgb,var(--color-accent)_26%,var(--color-surface))] px-2.5 py-1.5 text-sm font-semibold text-[var(--color-accent-foreground)] shadow-sm transition hover:bg-[color-mix(in_srgb,var(--color-accent)_42%,var(--color-surface))] hover:border-[var(--color-accent)]/80"
              >
                <LayoutDashboard
                  className="h-3.5 w-3.5 shrink-0 opacity-95"
                  aria-hidden
                  strokeWidth={2}
                />
                {dict.nav.administration}
              </Link>
              <SignOutButton
                locale={locale}
                label={dict.nav.logout}
                className="rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-muted)] active:scale-[0.98] sm:px-4"
              />
            </>
          ) : bootstrapAccountPending ? null : (
            <Link
              href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/setup/first-run`)}`}
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
    </header>
  );
}
