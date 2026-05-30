"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import { BrandFacebookIcon, BrandInstagramIcon } from "@/components/atoms/BrandSocialIcons";

export interface NagoSiteHeaderProps {
  locale: string;
  logoSrc: string;
  logoAlt: string;
  dict: Dictionary;
  sessionEmail: string | null;
  /** When set, adds a link to the public blog in desktop and mobile nav. */
  showBlogLink?: boolean;
  blogLabel?: string;
  /** When true, adds /events (uses labels.eventos). Defaults true — Nago always lists public events. */
  showEventsLink?: boolean;
  eventsLabel?: string;
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
  showBlogLink = false,
  blogLabel,
  showEventsLink = true,
  eventsLabel,
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
    ...(showEventsLink
      ? [{ href: `${prefix}/events`, label: eventsLabel ?? labels.eventos }]
      : []),
    ...(showBlogLink && blogLabel
      ? [{ href: `${prefix}/blog`, label: blogLabel }]
      : []),
    { href: `${prefix}#contacto`, label: labels.contacto },
  ];

  return (
    <header
      id="top"
      className="sticky top-0 z-50 border-b border-[var(--nago-green-light)]/30 bg-white/95 shadow-sm backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-[max(1rem,env(safe-area-inset-left))] py-2.5 pe-[max(1rem,env(safe-area-inset-right))] sm:py-3 md:gap-3 lg:gap-4 lg:py-4">
        <Link href={prefix} className="min-w-0 shrink-0" aria-label={logoAlt}>
          {/* eslint-disable-next-line @next/next/no-img-element -- local + Storage URLs */}
          <img
            src={logoSrc}
            alt=""
            width={360}
            height={108}
            decoding="async"
            fetchPriority="high"
            className="h-14 w-auto max-w-[200px] object-contain sm:h-16 sm:max-w-[260px] md:h-20 md:max-w-[300px] lg:h-[5.5rem] lg:max-w-[360px]"
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
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {fb ? (
            <a
              href={fb}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-11 w-11 items-center justify-center rounded-full text-[var(--nago-green)] transition-colors hover:bg-[var(--nago-green)]/10 md:inline-flex"
              aria-label={fbAria}
            >
              <BrandFacebookIcon className="h-5 w-5" />
            </a>
          ) : null}
          {ig ? (
            <a
              href={ig}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-11 w-11 items-center justify-center rounded-full text-[var(--nago-green)] transition-colors hover:bg-[var(--nago-green)]/10 md:inline-flex"
              aria-label={igAria}
            >
              <BrandInstagramIcon className="h-5 w-5" />
            </a>
          ) : null}
          <nav
            aria-label={dict.nav.accountAria}
            className="flex shrink-0 items-center gap-1.5 sm:gap-2"
          >
            {sessionEmail ? (
              <>
                <Link
                  href={`/${locale}/dashboard`}
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--nago-green)]/40 bg-white px-3 py-2 text-xs font-semibold text-[var(--nago-green)] shadow-sm transition hover:bg-[var(--nago-green)]/8 sm:px-3.5"
                  aria-label={dict.nav.administration}
                  title={dict.nav.administration}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                  <span className="hidden md:inline">{dict.nav.administration}</span>
                </Link>
                <SignOutButton
                  locale={locale}
                  label={dict.nav.logout}
                  iconOnly
                  title={dict.nav.logout}
                  className="inline-flex min-h-[44px] min-w-[44px] rounded-full border border-[var(--nago-green)]/40 bg-white text-[var(--nago-green)] shadow-sm transition hover:bg-[var(--nago-green)]/8"
                />
              </>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--nago-green)] px-3 py-2 text-xs font-semibold text-white shadow-[0_6px_18px_-8px_rgb(27_94_32_/55%)] transition hover:bg-[var(--nago-green-light)] sm:px-4"
                aria-label={dict.nav.login}
              >
                <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                <span className="hidden md:inline">{dict.nav.login}</span>
              </Link>
            )}
          </nav>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--nago-green)]/35 bg-white text-[var(--nago-green)] shadow-sm lg:hidden"
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
          className="border-t border-[var(--nago-green)]/15 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <nav aria-label={dict.nav.sectionsAria}>
            <ul className="flex flex-col gap-0.5">
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex min-h-[44px] items-center rounded-lg px-2 py-2 text-sm font-semibold uppercase text-[var(--nago-green)] hover:bg-[var(--nago-green)]/8"
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div
            className="mt-3 flex flex-col gap-2 border-t border-[var(--nago-green)]/15 pt-3"
            role="group"
            aria-label={dict.nav.accountAria}
          >
            {sessionEmail ? (
              <>
                <Link
                  href={`/${locale}/dashboard`}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[var(--nago-green)] px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                  {dict.nav.administration}
                </Link>
                <SignOutButton
                  locale={locale}
                  label={dict.nav.logout}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[var(--nago-green)]/40 bg-white px-4 py-2 text-sm font-semibold text-[var(--nago-green)]"
                />
              </>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[var(--nago-green)] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                {dict.nav.login}
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
