"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronsRight, LayoutDashboard, LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { SignOutButton } from "@/components/molecules/SignOutButton";

interface LandingHeaderPwaProps {
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  sessionEmail: string | null;
  isAdmin?: boolean;
}

const sectionPillClass =
  "inline-flex shrink-0 select-none snap-start items-center rounded-full border border-[var(--color-border)]/90 bg-[var(--color-surface)] px-3.5 py-2 text-[0.8125rem] font-semibold text-[var(--color-foreground)] shadow-sm ring-1 ring-[var(--color-border)]/30 active:scale-[0.98] active:bg-[var(--color-muted)]/90";

interface SectionScrollState {
  overflow: boolean;
  canLeft: boolean;
  canRight: boolean;
}

export function LandingHeaderPwa({
  brand,
  dict,
  locale,
  sessionEmail,
  isAdmin = false,
}: LandingHeaderPwaProps) {
  const sectionNavRef = useRef<HTMLElement>(null);
  const [sectionScroll, setSectionScroll] = useState<SectionScrollState>({
    overflow: false,
    canLeft: false,
    canRight: false,
  });

  const updateSectionScrollEdges = useCallback(() => {
    const el = sectionNavRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    const overflow = max > 6;
    setSectionScroll({
      overflow,
      canLeft: overflow && scrollLeft > 6,
      canRight: overflow && scrollLeft < max - 6,
    });
  }, []);

  useLayoutEffect(() => {
    const el = sectionNavRef.current;
    if (!el) return;
    updateSectionScrollEdges();
    el.addEventListener("scroll", updateSectionScrollEdges, { passive: true });
    const RO = typeof ResizeObserver !== "undefined" ? ResizeObserver : null;
    const ro = RO ? new RO(updateSectionScrollEdges) : null;
    if (ro) ro.observe(el);
    window.addEventListener("resize", updateSectionScrollEdges);
    return () => {
      el.removeEventListener("scroll", updateSectionScrollEdges);
      ro?.disconnect();
      window.removeEventListener("resize", updateSectionScrollEdges);
    };
  }, [updateSectionScrollEdges]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/60 bg-[var(--color-surface)]/90 pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_0_color-mix(in_srgb,var(--color-border)_55%,transparent)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-[var(--layout-max-width)] items-center justify-between gap-3 px-4 pb-3 pt-2">
        <Link
          href={`/${locale}`}
          className="group flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-[var(--layout-border-radius)] py-0.5 outline-none ring-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <div className="shrink-0 rounded-[var(--layout-border-radius)] bg-[var(--color-surface)] p-1 shadow-sm ring-1 ring-[var(--color-border)]">
            <Image
              src={brand.logoPath}
              alt={brand.logoAlt || brand.name}
              width={40}
              height={40}
              className="block h-8 w-8 rounded-[var(--layout-border-radius)] object-contain"
              priority
            />
          </div>
          <span className="font-display truncate text-[0.9375rem] font-semibold leading-tight tracking-tight text-[var(--color-primary)]">
            {brand.name}
          </span>
        </Link>
        <nav
          aria-label={dict.nav.accountAria}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-border)]/70 bg-[var(--color-muted)]/35 p-1"
        >
          <LanguageSwitcher
            locale={locale}
            labels={dict.common.locale}
            variant="compact"
          />
          {sessionEmail ? (
            <SignOutButton
              locale={locale}
              label={dict.nav.logout}
              iconOnly
              className="min-h-10 min-w-10 shrink-0 rounded-full border border-[var(--color-primary)]/25 bg-[var(--color-surface)] text-[var(--color-primary)] active:scale-[0.98]"
            />
          ) : (
            <Link
              href={`/${locale}/login`}
              className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-md active:scale-[0.98]"
              aria-label={dict.nav.login}
            >
              <LogIn className="h-[1.125rem] w-[1.125rem]" aria-hidden strokeWidth={1.75} />
            </Link>
          )}
        </nav>
      </div>
      <div
        className="border-t border-[var(--color-border)]/45 bg-[color-mix(in_srgb,var(--color-muted)_42%,var(--color-surface))]"
      >
        <p className="sr-only">{dict.nav.sectionsKicker}</p>
        {sectionScroll.overflow ? (
          <div className="flex items-center justify-end gap-1.5 px-4 pt-2">
            <span className="text-[0.7rem] font-semibold leading-none tracking-wide text-[var(--color-muted-foreground)]">
              {dict.nav.sectionsScrollHint}
            </span>
            <ChevronsRight
              className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)] opacity-90"
              aria-hidden
              strokeWidth={2}
            />
          </div>
        ) : null}
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-9 bg-gradient-to-r transition-opacity duration-200 from-[color-mix(in_srgb,var(--color-muted)_42%,var(--color-surface))] to-transparent"
            style={{ opacity: sectionScroll.canLeft ? 1 : 0 }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-11 bg-gradient-to-l transition-opacity duration-200 from-[color-mix(in_srgb,var(--color-muted)_42%,var(--color-surface))] to-transparent"
            style={{ opacity: sectionScroll.canRight ? 1 : 0 }}
            aria-hidden
          />
          <nav
            ref={sectionNavRef}
            aria-label={dict.nav.sectionsAria}
            className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <a href={`/${locale}#historia`} className={sectionPillClass}>
              {dict.nav.about}
            </a>
            <a href={`/${locale}#modalidades`} className={sectionPillClass}>
              {dict.nav.modalities}
            </a>
            <a href={`/${locale}#niveles`} className={sectionPillClass}>
              {dict.nav.courses}
            </a>
            <a href={`/${locale}#certificaciones`} className={sectionPillClass}>
              {dict.nav.certifications}
            </a>
            {isAdmin ? (
              <Link
                href={`/${locale}/dashboard/admin`}
                className="inline-flex shrink-0 select-none snap-start items-center gap-1.5 rounded-full border border-[var(--color-accent)]/60 bg-[color-mix(in_srgb,var(--color-accent)_24%,var(--color-surface))] px-3.5 py-2 text-[0.8125rem] font-semibold text-[var(--color-accent-foreground)] shadow-sm ring-1 ring-[var(--color-accent)]/35 active:scale-[0.98] active:bg-[color-mix(in_srgb,var(--color-accent)_38%,var(--color-surface))]"
              >
                <LayoutDashboard
                  className="h-3.5 w-3.5 shrink-0 opacity-95"
                  aria-hidden
                  strokeWidth={2}
                />
                {dict.nav.administration}
              </Link>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
