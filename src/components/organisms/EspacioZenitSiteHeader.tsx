"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronRight,
  LayoutDashboard,
  LogIn,
  Menu,
  X,
} from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { SignOutButton } from "@/components/molecules/SignOutButton";

export interface EspacioZenitSiteHeaderProps {
  locale: string;
  logoSrc: string;
  logoAlt: string;
  brandDisplayName: string;
  dict: Dictionary;
  sessionEmail: string | null;
}

const stroke = 1.75;

export function EspacioZenitSiteHeader({
  locale,
  logoSrc,
  logoAlt,
  brandDisplayName,
  dict,
  sessionEmail,
}: EspacioZenitSiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const prefix = `/${locale}`;
  const labels = dict.landing.ez;

  const links = [
    { href: `${prefix}#nosotros`, label: labels.nav.nosotros },
    { href: `${prefix}#disciplinas`, label: labels.nav.disciplinas },
    { href: `${prefix}#horarios`, label: labels.nav.horarios },
    { href: `${prefix}#galeria`, label: labels.nav.galeria },
    { href: `${prefix}#contacto`, label: labels.nav.contacto },
    { href: `${prefix}/register`, label: labels.nav.enroll },
  ];

  return (
    <header
      id="top"
      className="ez-mock-header sticky top-0 z-50 border-b border-[rgb(0_174_239_/35%)] bg-black shadow-[0_12px_40px_rgb(0_0_0_/55%)]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-[max(1rem,env(safe-area-inset-left))] py-3 pe-[max(1rem,env(safe-area-inset-right))] md:gap-4 lg:py-4">
        <Link
          href={`${prefix}#top`}
          className="ez-mock-brand-link flex min-w-0 shrink-0 items-center gap-3 text-left no-underline"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Storage URLs + wizard uploads */}
          <img
            src={logoSrc}
            alt={logoAlt}
            width={56}
            height={56}
            decoding="async"
            fetchPriority="high"
            className="h-12 w-12 shrink-0 rounded-full border-2 border-[var(--ez-cyan)] bg-black object-contain p-1 md:h-14 md:w-14"
          />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold uppercase tracking-[0.12em] text-white md:text-base">
              {brandDisplayName}
            </span>
            <span className="mt-0.5 block max-w-[14rem] text-[10px] font-medium uppercase tracking-[0.14em] text-white/72 md:max-w-none md:text-[11px]">
              {labels.header.subtitle}
            </span>
          </span>
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-1 lg:flex xl:gap-2"
          aria-label={dict.nav.sectionsAria}
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="ez-mock-nav-link inline-flex min-h-[44px] items-center whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/88 transition-colors hover:text-[var(--ez-cyan)] xl:px-4 xl:text-xs"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher
            locale={locale}
            labels={dict.common.locale}
            variant="compactDark"
          />
          {sessionEmail ? (
            <>
              <Link
                href={`/${locale}/dashboard`}
                className="hidden min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-2 text-[11px] font-bold text-white transition hover:bg-white/18 xl:inline-flex"
                title={dict.nav.administration}
                aria-label={dict.nav.administration}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
              </Link>
              <SignOutButton
                locale={locale}
                label={dict.nav.logout}
                iconOnly
                title={dict.nav.logout}
                className="hidden min-h-[44px] min-w-[44px] rounded-xl border border-white/35 bg-white/10 text-white xl:flex"
              />
            </>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="hidden min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-3 py-2 text-[11px] font-bold text-white hover:bg-white/18 xl:inline-flex"
              aria-label={dict.nav.login}
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
              <span className="hidden 2xl:inline">{dict.nav.login}</span>
            </Link>
          )}
          <button
            type="button"
            className="ez-mock-menu-btn inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-white/35 bg-white/10 text-white lg:hidden"
            aria-expanded={open}
            aria-controls="ez-mock-mobile-nav"
            aria-label={open ? labels.chrome.closeMenu : labels.chrome.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X className="h-6 w-6" aria-hidden />
            ) : (
              <Menu className="h-6 w-6" aria-hidden />
            )}
          </button>
        </div>
      </div>
      {open ? (
        <nav
          id="ez-mock-mobile-nav"
          className="border-t border-[rgb(0_174_239_/25%)] bg-[#070b12] px-[max(1rem,env(safe-area-inset-left))] py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pe-[max(1rem,env(safe-area-inset-right))] lg:hidden"
          aria-label={dict.nav.sectionsAria}
        >
          <ul className="flex flex-col gap-1">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex min-h-[48px] items-center gap-2 rounded-xl px-2 py-2 text-base font-semibold text-white/92 hover:bg-white/8 hover:text-[var(--ez-cyan)]"
                  onClick={() => setOpen(false)}
                >
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--ez-cyan)]" aria-hidden />
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
