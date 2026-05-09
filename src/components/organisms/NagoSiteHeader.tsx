"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { SignOutButton } from "@/components/molecules/SignOutButton";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073c0 5.989 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491-.001-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z"
      />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
      />
    </svg>
  );
}

export interface NagoSiteHeaderProps {
  locale: string;
  logoSrc: string;
  logoAlt: string;
  dict: Dictionary;
  sessionEmail: string | null;
  labels: {
    inicio: string;
    sobreNosotros: string;
    clases: string;
    galeria: string;
    eventos: string;
    contacto: string;
    openMenu: string;
    closeMenu: string;
  };
}

const stroke = 1.75;

export function NagoSiteHeader({
  locale,
  logoSrc,
  logoAlt,
  dict,
  sessionEmail,
  labels,
}: NagoSiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const prefix = `/${locale}`;
  const fb = marketingLandingCopy(dict, "nago", "contact.facebookUrl").trim();
  const ig = marketingLandingCopy(dict, "nago", "contact.instagramUrl").trim();
  const fbAria = marketingLandingCopy(dict, "nago", "chrome.facebookAria").trim();
  const igAria = marketingLandingCopy(dict, "nago", "chrome.instagramAria").trim();
  const links = [
    { href: `${prefix}#top`, label: labels.inicio },
    { href: `${prefix}#sobre`, label: labels.sobreNosotros },
    { href: `${prefix}#principios`, label: labels.clases },
    { href: `${prefix}#galeria`, label: labels.galeria },
    { href: `${prefix}#cta`, label: labels.eventos },
    { href: `${prefix}#contacto`, label: labels.contacto },
  ];

  return (
    <header
      id="top"
      className="sticky top-0 z-50 border-b border-[var(--nago-green-light)]/30 bg-white/95 shadow-sm backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-[max(1rem,env(safe-area-inset-left))] py-3 pe-[max(1rem,env(safe-area-inset-right))]">
        <Link href={prefix} className="min-w-0 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- local + Storage URLs */}
          <img
            src={logoSrc}
            alt={logoAlt}
            width={360}
            height={108}
            decoding="async"
            fetchPriority="high"
            className="h-20 w-auto max-h-[7rem] max-w-[360px] object-contain sm:h-[5.25rem] md:h-24 lg:h-[6.5rem]"
          />
        </Link>
        <nav
          className="hidden items-center lg:flex"
          aria-label={dict.nav.sectionsAria}
        >
          {links.map(({ href, label }, i) => (
            <span key={href} className="flex items-center">
              <Link
                href={href}
                className="inline-flex min-h-[44px] items-center px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--nago-ink)] underline-offset-4 transition-colors hover:text-[var(--nago-green)] xl:text-xs"
              >
                {label}
              </Link>
              {i < links.length - 1 && (
                <span className="text-[var(--nago-ink)]/30 select-none" aria-hidden>
                  |
                </span>
              )}
            </span>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5">
          {fb ? (
            <a
              href={fb}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-[var(--nago-green)] transition-colors hover:bg-[var(--nago-green)]/10 sm:inline-flex"
              aria-label={fbAria}
            >
              <FacebookIcon className="h-5 w-5" />
            </a>
          ) : null}
          {ig ? (
            <a
              href={ig}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-[var(--nago-green)] transition-colors hover:bg-[var(--nago-green)]/10 sm:inline-flex"
              aria-label={igAria}
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
          ) : null}
          <LanguageSwitcher
            locale={locale}
            labels={dict.common.locale}
            variant="compact"
          />
          {sessionEmail ? (
            <>
              <Link
                href={`/${locale}/dashboard`}
                className="hidden min-h-[44px] items-center justify-center gap-2 rounded-full border border-[var(--nago-green)]/40 px-3 py-2 text-xs font-semibold text-[var(--nago-green)] lg:inline-flex"
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                {dict.nav.administration}
              </Link>
              <SignOutButton locale={locale} label={dict.nav.logout} />
            </>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="hidden min-h-[44px] items-center justify-center gap-2 rounded-full bg-[var(--nago-green)] px-4 py-2 text-xs font-semibold text-white lg:inline-flex"
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
              {dict.nav.login}
            </Link>
          )}
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--nago-green)]/35 text-[var(--nago-green)] lg:hidden"
            aria-expanded={open}
            aria-controls="nago-mobile-nav"
            aria-label={open ? labels.closeMenu : labels.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden strokeWidth={stroke} />
            ) : (
              <Menu className="h-5 w-5" aria-hidden strokeWidth={stroke} />
            )}
          </button>
        </div>
      </div>
      {open ? (
        <div
          id="nago-mobile-nav"
          className="border-t border-[var(--nago-green)]/15 bg-white px-4 py-3 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="min-h-[44px] rounded-md px-2 py-2 text-sm font-semibold uppercase text-[var(--nago-green)]"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            {!sessionEmail ? (
              <Link
                href={`/${locale}/login`}
                className="mt-2 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[var(--nago-green)] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                {dict.nav.login}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
