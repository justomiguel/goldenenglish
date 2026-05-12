"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { SignOutButton } from "@/components/molecules/SignOutButton";

export interface MozarthitosSiteHeaderLabels {
  inicio: string;
  quienes: string;
  cursos: string;
  sedes: string;
  contacto: string;
  openMenu: string;
  closeMenu: string;
}

export interface MozarthitosSiteHeaderProps {
  locale: string;
  logoSrc: string;
  logoAlt: string;
  logoWidth: number;
  logoHeight: number;
  labels: MozarthitosSiteHeaderLabels;
  dict: Dictionary;
  sessionEmail: string | null;
  /** Fragment ids for in-page nav (default: quienes, cursos, sedes, contacto). */
  navSectionIds?: Partial<{
    quienes: string;
    cursos: string;
    sedes: string;
    contacto: string;
  }>;
}

const stroke = 1.75;

export function MozarthitosSiteHeader({
  locale,
  logoSrc,
  logoAlt,
  logoWidth,
  logoHeight,
  labels,
  dict,
  sessionEmail,
  navSectionIds,
}: MozarthitosSiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const prefix = `/${locale}`;
  const q = navSectionIds?.quienes ?? "quienes";
  const c = navSectionIds?.cursos ?? "cursos";
  const s = navSectionIds?.sedes ?? "sedes";
  const k = navSectionIds?.contacto ?? "contacto";
  const links = [
    { href: `${prefix}#top`, label: labels.inicio },
    { href: `${prefix}#${q}`, label: labels.quienes },
    { href: `${prefix}#${c}`, label: labels.cursos },
    { href: `${prefix}#${s}`, label: labels.sedes },
    { href: `${prefix}#${k}`, label: labels.contacto },
  ];

  return (
    <header
      id="top"
      className="mz-site-header sticky top-0 z-50"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mz-site-header-accent w-full shrink-0" aria-hidden />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-[max(1rem,env(safe-area-inset-left))] py-3 pe-[max(1rem,env(safe-area-inset-right))] sm:gap-3 md:gap-4 lg:py-4">
        <Link href={prefix} className="mz-header-logo-link min-w-0 shrink-0">
          {/*
            `next/image` + remotePatterns del build; logos en Storage: <img> directo.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase public URLs + /public */}
          <img
            src={logoSrc}
            alt={logoAlt}
            width={logoWidth}
            height={logoHeight}
            decoding="async"
            fetchPriority="high"
            className="mz-header-logo-img h-9 w-auto max-h-12 max-w-[min(100%,220px)] object-contain sm:h-10 md:max-w-none lg:h-12"
          />
        </Link>
        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 lg:flex xl:gap-2"
          aria-label={dict.nav.sectionsAria}
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="mz-nav-link mz-nav-link--desktop inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.06em] underline-offset-4 transition-all duration-200 ease-out hover:scale-[1.02] hover:underline xl:px-4 xl:text-sm"
            >
              {label}
            </Link>
          ))}
        </nav>
        <nav
          aria-label={dict.nav.accountAria}
          className="mz-chrome-tools flex shrink-0 items-center gap-1.5 sm:gap-2"
        >
          <LanguageSwitcher
            locale={locale}
            labels={dict.common.locale}
            variant="compactDark"
          />
          {sessionEmail ? (
            <>
              <Link
                href={`/${locale}/dashboard`}
                className="mz-chrome-dash inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border-2 border-white/50 bg-white/15 px-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-white/25 sm:px-3"
                title={dict.nav.administration}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                <span className="hidden xl:inline">{dict.nav.administration}</span>
              </Link>
              <SignOutButton
                locale={locale}
                label={dict.nav.logout}
                iconOnly
                title={dict.nav.logout}
                className="mz-chrome-signout min-h-[44px] min-w-[44px] rounded-2xl border-2 border-white/50 bg-white/15 text-white shadow-sm transition hover:bg-white/25"
              />
            </>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="mz-chrome-login inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border-2 border-white/55 bg-[var(--mz-yellow)] px-3 py-2 text-xs font-bold text-[var(--mz-ink-on-white)] shadow-md transition hover:bg-[var(--mz-yellow-soft)] sm:px-4 sm:text-sm"
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
              <span className="hidden sm:inline">{dict.nav.login}</span>
            </Link>
          )}
        </nav>
        <button
          type="button"
          className="mz-menu-btn inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-2xl lg:hidden"
          aria-expanded={open}
          aria-controls="mz-mobile-nav"
          aria-label={open ? labels.closeMenu : labels.openMenu}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X className="h-6 w-6" aria-hidden />
          ) : (
            <Menu className="h-6 w-6" aria-hidden />
          )}
        </button>
      </div>
      {open ? (
        <nav
          id="mz-mobile-nav"
          className="mz-mobile-sheet border-t px-[max(1rem,env(safe-area-inset-left))] py-3 pe-[max(1rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
          aria-label="Primary mobile"
        >
          <ul className="flex flex-col gap-1">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="mz-nav-link flex min-h-[48px] items-center rounded-xl px-1 py-2 text-base font-semibold"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
