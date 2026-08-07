"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, LogIn, Menu, MessageCircle, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import { BrandInstagramIcon } from "@/components/atoms/BrandSocialIcons";

export interface LioraSiteHeaderProps {
  locale: string;
  logoSrc: string;
  logoAlt: string;
  dict: Dictionary;
  sessionEmail: string | null;
  /** When set, adds a link to the public blog in desktop and mobile nav. */
  showBlogLink?: boolean;
  blogLabel?: string;
  showEventsLink?: boolean;
  eventsLabel?: string;
  /** Site setup URLs (`social.*`); fall back to the dictionary when empty. */
  instagramUrl?: string;
  whatsappUrl?: string;
  labels: {
    inicio: string;
    sobreNosotros: string;
    clases: string;
    sedes: string;
    horarios: string;
    galeria: string;
    eventos: string;
    contacto: string;
    openMenu: string;
    closeMenu: string;
  };
}

const stroke = 1.5;

export function LioraSiteHeader({
  locale,
  logoSrc,
  logoAlt,
  dict,
  sessionEmail,
  showBlogLink = false,
  blogLabel,
  showEventsLink = true,
  eventsLabel,
  instagramUrl,
  whatsappUrl,
  labels,
}: LioraSiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const prefix = `/${locale}`;
  const ig =
    instagramUrl?.trim() ||
    marketingLandingCopy(dict, "liora", "contact.instagramUrl").trim();
  const wa =
    whatsappUrl?.trim() ||
    marketingLandingCopy(dict, "liora", "contact.whatsappUrl").trim();
  const igAria = marketingLandingCopy(dict, "liora", "chrome.instagramAria").trim();
  const waAria = marketingLandingCopy(dict, "liora", "chrome.whatsappAria").trim();
  const links = [
    { href: `${prefix}#top`, label: labels.inicio },
    { href: `${prefix}#sobre`, label: labels.sobreNosotros },
    { href: `${prefix}#clases`, label: labels.clases },
    { href: `${prefix}#sedes`, label: labels.sedes },
    { href: `${prefix}#horarios`, label: labels.horarios },
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
      className="sticky top-0 z-50 border-b border-[var(--liora-line)] bg-[color-mix(in_srgb,var(--liora-cream)_94%,transparent)] backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-[max(1rem,env(safe-area-inset-left))] py-2 pe-[max(1rem,env(safe-area-inset-right))] sm:py-2.5 md:gap-3 lg:gap-4 lg:py-3">
        <Link href={prefix} className="min-w-0 shrink-0" aria-label={logoAlt}>
          {/* eslint-disable-next-line @next/next/no-img-element -- local + Storage URLs */}
          <img
            src={logoSrc}
            alt=""
            width={220}
            height={220}
            decoding="async"
            fetchPriority="high"
            className="h-14 w-auto max-w-[160px] object-contain sm:h-16 md:h-[4.5rem] md:max-w-[200px]"
          />
        </Link>
        <nav
          className="hidden items-center lg:flex"
          aria-label={dict.nav.sectionsAria}
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-[44px] items-center px-2.5 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--liora-ink)] transition-colors hover:text-[var(--liora-rose-deep)] xl:px-3"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {ig ? (
            <a
              href={ig}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-11 w-11 items-center justify-center rounded-full text-[var(--liora-rose-deep)] transition-colors hover:bg-[color-mix(in_srgb,var(--liora-rose)_18%,transparent)] md:inline-flex"
              aria-label={igAria}
            >
              <BrandInstagramIcon className="h-5 w-5" />
            </a>
          ) : null}
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-11 w-11 items-center justify-center rounded-full text-[var(--liora-rose-deep)] transition-colors hover:bg-[color-mix(in_srgb,var(--liora-rose)_18%,transparent)] md:inline-flex"
              aria-label={waAria}
            >
              <MessageCircle className="h-5 w-5" aria-hidden strokeWidth={stroke} />
            </a>
          ) : null}
          <nav
            aria-label={dict.nav.accountAria}
            className="flex shrink-0 items-center gap-1.5 sm:gap-2"
          >
            {sessionEmail ? (
              <>
                <Link
                  href={`${prefix}/dashboard`}
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--liora-rose-deep)]/40 bg-white px-3 py-2 text-xs font-medium tracking-wide text-[var(--liora-rose-deep)] transition hover:bg-[color-mix(in_srgb,var(--liora-rose)_12%,#ffffff)] sm:px-3.5"
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
                  className="inline-flex min-h-[44px] min-w-[44px] rounded-full border border-[var(--liora-rose-deep)]/40 bg-white text-[var(--liora-rose-deep)] transition hover:bg-[color-mix(in_srgb,var(--liora-rose)_12%,#ffffff)]"
                />
              </>
            ) : (
              <Link
                href={`${prefix}/login`}
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--liora-rose-deep)] px-3 py-2 text-xs font-medium tracking-wide text-white transition hover:bg-[var(--liora-rose-hover)] sm:px-4"
                aria-label={dict.nav.login}
              >
                <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                <span className="hidden md:inline">{dict.nav.login}</span>
              </Link>
            )}
          </nav>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--liora-rose-deep)]/35 bg-white text-[var(--liora-rose-deep)] lg:hidden"
            aria-expanded={open}
            aria-controls="liora-mobile-nav"
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
          id="liora-mobile-nav"
          className="border-t border-[var(--liora-line)] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <nav aria-label={dict.nav.sectionsAria}>
            <ul className="flex flex-col gap-0.5">
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex min-h-[44px] items-center rounded-lg px-2 py-2 text-sm font-medium uppercase tracking-[0.14em] text-[var(--liora-ink)] hover:bg-[var(--liora-blush)]"
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div
            className="mt-3 flex flex-col gap-2 border-t border-[var(--liora-line)] pt-3"
            role="group"
            aria-label={dict.nav.accountAria}
          >
            {sessionEmail ? (
              <>
                <Link
                  href={`${prefix}/dashboard`}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[var(--liora-rose-deep)] px-4 py-2 text-sm font-medium text-white"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                  {dict.nav.administration}
                </Link>
                <SignOutButton
                  locale={locale}
                  label={dict.nav.logout}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[var(--liora-rose-deep)]/40 bg-white px-4 py-2 text-sm font-medium text-[var(--liora-rose-deep)]"
                />
              </>
            ) : (
              <Link
                href={`${prefix}/login`}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[var(--liora-rose-deep)] px-4 py-2 text-sm font-medium text-white"
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
