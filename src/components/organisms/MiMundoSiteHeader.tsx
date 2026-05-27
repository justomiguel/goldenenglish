"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, LogIn, Menu, Sparkles, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { SignOutButton } from "@/components/molecules/SignOutButton";

function FbIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17 2h-3a5 5 0 0 0-5 5v3H6v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IgIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export interface MiMundoSiteHeaderProps {
  locale: string;
  logoSrc: string;
  logoAlt: string;
  dict: Dictionary;
  sessionEmail: string | null;
  socialFacebook?: string;
  socialInstagram?: string;
  labels: {
    inicio: string;
    propuesta: string;
    salas: string;
    galeria: string;
    contacto: string;
    openMenu: string;
    closeMenu: string;
    login: string;
    reservar: string;
  };
}

const stroke = 1.75;

export function MiMundoSiteHeader({
  locale,
  logoSrc,
  logoAlt,
  dict,
  sessionEmail,
  socialFacebook,
  socialInstagram,
  labels,
}: MiMundoSiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const prefix = `/${locale}`;

  const fb = (socialFacebook ?? "").trim();
  const ig = (socialInstagram ?? "").trim();
  const fbAria = marketingLandingCopy(dict, "mm", "chrome.facebookAria").trim();
  const igAria = marketingLandingCopy(dict, "mm", "chrome.instagramAria").trim();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: `${prefix}#top`, label: labels.inicio },
    { href: `${prefix}#propuesta`, label: labels.propuesta },
    { href: `${prefix}#salas`, label: labels.salas },
    { href: `${prefix}#galeria`, label: labels.galeria },
    { href: `${prefix}#contacto`, label: labels.contacto },
  ];

  return (
    <header
      ref={headerRef}
      id="top"
      className={`mm-header sticky top-0 z-50 border-b border-[var(--mm-green)]/20 bg-[var(--mm-cream)]/95${scrolled ? " mm-scrolled" : ""}`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-[max(1rem,env(safe-area-inset-left))] py-2.5 pe-[max(1rem,env(safe-area-inset-right))] sm:py-3 md:gap-3 lg:gap-4 lg:py-4">
        <Link href={prefix} className="min-w-0 shrink-0" aria-label={logoAlt}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt=""
            width={360}
            height={108}
            decoding="async"
            fetchPriority="high"
            className="h-14 w-auto max-w-[180px] object-contain sm:h-16 sm:max-w-[240px] md:h-20 md:max-w-[280px] lg:h-[5rem] lg:max-w-[320px]"
          />
        </Link>
        <nav className="hidden items-center lg:flex" aria-label={dict.nav.sectionsAria}>
          {links.map(({ href, label }, i) => (
            <span key={href} className="flex items-center">
              <Link
                href={href}
                className="inline-flex min-h-[44px] items-center px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--mm-ink)] underline-offset-4 transition-colors hover:text-[var(--mm-green)] xl:text-xs"
              >
                {label}
              </Link>
              {i < links.length - 1 && (
                <span className="select-none text-[var(--mm-ink)]/30" aria-hidden>|</span>
              )}
            </span>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {fb ? (
            <a href={fb} target="_blank" rel="noopener noreferrer"
              className="hidden h-11 w-11 items-center justify-center rounded-full text-[var(--mm-green)] transition-colors hover:bg-[var(--mm-green)]/10 md:inline-flex"
              aria-label={fbAria}>
              <FbIcon className="h-5 w-5" />
            </a>
          ) : null}
          {ig ? (
            <a href={ig} target="_blank" rel="noopener noreferrer"
              className="hidden h-11 w-11 items-center justify-center rounded-full text-[var(--mm-green)] transition-colors hover:bg-[var(--mm-green)]/10 md:inline-flex"
              aria-label={igAria}>
              <IgIcon className="h-5 w-5" />
            </a>
          ) : null}
          <nav aria-label={dict.nav.accountAria} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {sessionEmail ? (
              <>
                <Link href={`/${locale}/dashboard`}
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--mm-green)]/40 bg-white px-3 py-2 text-xs font-semibold text-[var(--mm-green)] shadow-sm transition hover:bg-[var(--mm-green)]/8 sm:px-3.5"
                  aria-label={dict.nav.administration} title={dict.nav.administration}>
                  <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                  <span className="hidden md:inline">{dict.nav.administration}</span>
                </Link>
                <SignOutButton locale={locale} label={dict.nav.logout} iconOnly title={dict.nav.logout}
                  className="inline-flex min-h-[44px] min-w-[44px] rounded-full border border-[var(--mm-green)]/40 bg-white text-[var(--mm-green)] shadow-sm transition hover:bg-[var(--mm-green)]/8" />
              </>
            ) : (
              <>
                <Link href={`/${locale}/login`}
                  className="hidden min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--mm-green)]/50 bg-white px-3 py-2 text-xs font-semibold text-[var(--mm-green)] shadow-sm transition hover:bg-[var(--mm-green)]/8 sm:inline-flex sm:px-4"
                  aria-label={labels.login}>
                  <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                  <span className="hidden md:inline">{labels.login}</span>
                </Link>
                <Link href={`/${locale}/register`}
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--mm-blue-dark)] px-3 py-2 text-xs font-semibold text-white shadow-[0_6px_18px_-8px_rgb(35_94_142_/55%)] transition hover:bg-[#1a486c] sm:px-4"
                  aria-label={labels.reservar}>
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                  <span>{labels.reservar}</span>
                </Link>
              </>
            )}
          </nav>
          <button type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--mm-green)]/35 bg-white text-[var(--mm-green)] shadow-sm lg:hidden"
            aria-expanded={open} aria-controls="mm-mobile-nav"
            aria-label={open ? labels.closeMenu : labels.openMenu}
            onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-5 w-5" aria-hidden strokeWidth={stroke} /> : <Menu className="h-5 w-5" aria-hidden strokeWidth={stroke} />}
          </button>
        </div>
      </div>
      {open ? (
        <div id="mm-mobile-nav" className="border-t border-[var(--mm-green)]/15 bg-[var(--mm-cream)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
          <nav aria-label={dict.nav.sectionsAria}>
            <ul className="flex flex-col gap-0.5">
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href}
                    className="flex min-h-[44px] items-center rounded-lg px-2 py-2 text-sm font-semibold uppercase text-[var(--mm-green)] hover:bg-[var(--mm-green)]/8"
                    onClick={() => setOpen(false)}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-[var(--mm-green)]/15 pt-3" role="group" aria-label={dict.nav.accountAria}>
            {sessionEmail ? (
              <>
                <Link href={`/${locale}/dashboard`}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[var(--mm-green)] px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => setOpen(false)}>
                  <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                  {dict.nav.administration}
                </Link>
                <SignOutButton locale={locale} label={dict.nav.logout}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[var(--mm-green)]/40 bg-white px-4 py-2 text-sm font-semibold text-[var(--mm-green)]" />
              </>
            ) : (
              <>
                <Link href={`/${locale}/login`}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[var(--mm-green)]/50 bg-white px-4 py-2 text-sm font-semibold text-[var(--mm-green)]"
                  onClick={() => setOpen(false)}>
                  <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                  {labels.login}
                </Link>
                <Link href={`/${locale}/register`}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[var(--mm-blue-dark)] px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => setOpen(false)}>
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                  {labels.reservar}
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
