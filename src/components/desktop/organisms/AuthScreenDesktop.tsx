import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { LoginHeroPanel } from "@/components/molecules/LoginHeroPanel";

interface AuthScreenDesktopProps {
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  children: ReactNode;
}

/**
 * Two-column auth chrome (hero on the left, form on the right). Shared by
 * `/login`, `/forgot-password` and `/reset-password` so the brand panel,
 * navigation, language switcher and shadow treatment stay aligned.
 */
export function AuthScreenDesktop({
  brand,
  dict,
  locale,
  children,
}: AuthScreenDesktopProps) {
  const homeHref = `/${locale}`;

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[var(--color-background)] md:grid-cols-2">
      <aside
        className="relative isolate flex min-h-[38vh] flex-col justify-center overflow-hidden bg-[var(--color-primary-dark)] px-8 py-12 text-[var(--color-primary-foreground)] sm:min-h-[40vh] md:min-h-screen md:px-12 md:py-16 lg:px-16"
        aria-label={brand.name}
      >
        <div
          className="pointer-events-none absolute -left-28 top-0 h-[min(420px,70vw)] w-[min(420px,70vw)] rounded-full bg-[var(--color-secondary)]/25 blur-3xl animate-float-slow"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 bottom-0 h-[min(360px,65vw)] w-[min(360px,65vw)] rounded-full bg-[var(--color-accent)]/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,transparent_0%,rgb(0_0_0_/14%)_100%)]"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/55 to-transparent"
          aria-hidden
        />
        <div className="animate-fade-up relative">
          <LoginHeroPanel brand={brand} locale={locale} />
        </div>
      </aside>

      <section className="relative flex flex-col border-t border-[var(--color-border)] md:border-t-0 md:border-l md:border-[var(--color-border)] md:shadow-[inset_1px_0_0_rgb(255_255_255_/60%)]">
        <header className="flex items-center justify-between gap-4 px-5 pt-5 sm:px-8 sm:pt-7">
          <Link
            href={homeHref}
            className="inline-flex items-center gap-2 rounded-[var(--layout-border-radius)] px-2 py-2 text-sm font-semibold text-[var(--color-foreground)] outline-none ring-[var(--color-primary)] transition hover:bg-[var(--color-muted)]/80 hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <ArrowLeft
              className="h-4 w-4 shrink-0 opacity-80"
              aria-hidden
              strokeWidth={2}
            />
            {dict.nav.home}
          </Link>
          <LanguageSwitcher locale={locale} labels={dict.common.locale} />
        </header>

        <div className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-8 sm:py-14 md:py-16 lg:px-12">
          <div className="animate-fade-up animate-delay-1 mx-auto w-full max-w-[22rem] sm:max-w-md">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
