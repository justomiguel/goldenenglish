"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import { taglineForLocale } from "@/lib/brand/taglineForLocale";
import type { Dictionary } from "@/types/i18n";
import type { AppSurface } from "@/hooks/useAppSurface";
import { LoginForm } from "@/components/organisms/LoginForm";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";

interface LoginScreenNarrowProps {
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  nextPath?: string | null;
  surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">;
}

export function LoginScreenNarrow({
  brand,
  dict,
  locale,
  nextPath = null,
  surface,
}: LoginScreenNarrowProps) {
  const homeHref = `/${locale}`;
  const standalone = surface === "pwa-mobile";
  const tagline = taglineForLocale(brand, locale);
  const bypassLogoOptimizer = brand.logoPath.startsWith("/images/");
  const bottomPad = standalone
    ? "pb-[max(1rem,env(safe-area-inset-bottom,0px))]"
    : "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]";

  return (
    <main
      className={`flex min-h-dvh flex-col bg-[var(--color-background)] ${bottomPad}`}
    >
      <header
        className={`flex items-center justify-between gap-3 px-4 ${standalone ? "pt-[max(0.35rem,env(safe-area-inset-top,0px))]" : "pt-[max(0.25rem,env(safe-area-inset-top,0px))]"}`}
      >
        <Link
          href={homeHref}
          className="inline-flex min-h-11 min-w-11 items-center justify-start gap-2 rounded-[var(--layout-border-radius)] px-2 py-2 text-sm font-semibold text-[var(--color-foreground)] outline-none ring-[var(--color-primary)] transition active:bg-[var(--color-muted)] focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <ArrowLeft
            className="h-5 w-5 shrink-0 opacity-90"
            aria-hidden
            strokeWidth={2}
          />
          <span className="sr-only sm:not-sr-only">{dict.nav.home}</span>
        </Link>
        <LanguageSwitcher locale={locale} labels={dict.common.locale} />
      </header>

      <section
        className="relative isolate mx-4 mt-4 overflow-hidden rounded-2xl bg-[var(--color-primary-dark)] px-5 py-6 text-[var(--color-primary-foreground)]"
        aria-label={brand.name}
      >
        <div
          className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-[var(--color-accent)]/15 blur-2xl"
          aria-hidden
        />
        <Link
          href={homeHref}
          className="relative flex items-center gap-4 rounded-[var(--layout-border-radius)] outline-none ring-offset-2 ring-offset-[var(--color-primary-dark)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <div className="shrink-0 rounded-[var(--layout-border-radius)] bg-white p-1.5 ring-1 ring-[var(--color-border)]">
            <Image
              src={brand.logoPath}
              alt={brand.logoAlt || brand.name}
              width={64}
              height={64}
              unoptimized={bypassLogoOptimizer}
              className="block h-14 w-14 rounded-[var(--layout-border-radius)]"
              priority
            />
          </div>
          <div className="min-w-0 text-left">
            <p className="font-display text-lg font-semibold leading-tight tracking-tight">
              {brand.name}
            </p>
            {tagline ? (
              <p className="mt-1 line-clamp-2 text-xs leading-snug text-white/85">
                {tagline}
              </p>
            ) : null}
          </div>
        </Link>
      </section>

      <div className="flex flex-1 flex-col px-4 pb-6 pt-8">
        <div className="mx-auto w-full max-w-[22rem]">
          <LoginForm
            labels={dict.login}
            locale={locale}
            nextPath={nextPath}
          />
        </div>
      </div>
    </main>
  );
}
