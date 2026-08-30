"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import { NagoSiteHeaderMobileNav } from "@/components/organisms/NagoSiteHeaderMobileNav";
import { useNagoSiteHeaderChrome } from "@/components/organisms/useNagoSiteHeaderChrome";
import { NagoSoundToggle } from "@/components/organisms/NagoSoundToggle";
import type { NagoSiteHeaderLabels } from "@/lib/landing/nagoSiteHeaderLabels";

export interface NagoSiteHeaderProps {
  locale: string;
  logoSrc: string;
  logoAlt: string;
  dict: Dictionary;
  sessionEmail: string | null;
  showBlogLink?: boolean;
  blogLabel?: string;
  showEventsLink?: boolean;
  eventsLabel?: string;
  overlayHero?: boolean;
  labels: NagoSiteHeaderLabels;
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
  overlayHero = false,
  labels,
}: NagoSiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const { barRef, spacerPx, scrolled, activeHref } = useNagoSiteHeaderChrome(
    locale,
    overlayHero,
  );
  const prefix = `/${locale}`;
  const links = [
    { href: `${prefix}#top`, label: labels.inicio },
    { href: `${prefix}#clases`, label: labels.clases },
    { href: `${prefix}#horarios`, label: labels.horarios },
    { href: `${prefix}#nago`, label: labels.nago },
    ...(showEventsLink
      ? [{ href: `${prefix}/events`, label: eventsLabel ?? labels.eventos }]
      : []),
    { href: `${prefix}#galeria`, label: labels.galeria },
    ...(showBlogLink && blogLabel
      ? [{ href: `${prefix}/blog`, label: blogLabel }]
      : []),
    { href: `${prefix}#contacto`, label: labels.contacto },
  ];

  return (
    <>
      <header
        id="top"
        className={`nago-site-header fixed inset-x-0 top-0 z-[80]${scrolled ? " is-scrolled" : ""}${overlayHero ? " is-overlay" : ""}`}
      >
        <div
          ref={barRef}
          style={{ paddingTop: "env(safe-area-inset-top)" }}
          className="mx-auto flex h-[var(--nago-header-h)] max-w-7xl items-center justify-between gap-2 px-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))] lg:gap-3"
        >
          <Link href={prefix} className="flex h-full shrink-0 items-stretch leading-none" aria-label={logoAlt}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local + Storage URLs */}
            <img
              src={logoSrc}
              alt=""
              width={918}
              height={554}
              decoding="async"
              fetchPriority="high"
              className="nago-logo-knockout block h-full w-auto max-w-[14rem] object-contain object-left sm:max-w-[17rem] lg:max-w-[20rem]"
            />
          </Link>
          <nav
            className="hidden flex-1 items-center justify-center md:flex"
            aria-label={dict.nav.sectionsAria}
          >
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={href === activeHref ? "page" : undefined}
                className={`nago-nav-link inline-flex min-h-[44px] items-center px-1.5 py-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--nago-ink)] transition-colors hover:text-[var(--nago-gold)] lg:px-2.5 lg:text-[11px]${href === activeHref ? " is-active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <NagoSoundToggle dict={dict} />
            <Link
              href={`/${locale}/register`}
              className="nago-btn hidden px-3 py-2 text-[10px] sm:inline-flex lg:px-4"
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden strokeWidth={stroke} />
              {labels.agendaCta}
            </Link>
            <nav
              aria-label={dict.nav.accountAria}
              className="flex shrink-0 items-center gap-1"
            >
              {sessionEmail ? (
                <>
                  <Link
                    href={`/${locale}/dashboard`}
                    className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--nago-gold)]/50 bg-transparent px-3 py-2 text-xs font-semibold text-[var(--nago-gold)] transition hover:bg-[var(--nago-gold)]/10"
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
                    className="inline-flex min-h-[44px] min-w-[44px] rounded-full border border-[var(--nago-gold)]/50 bg-transparent text-[var(--nago-gold)] transition hover:bg-[var(--nago-gold)]/10"
                  />
                </>
              ) : (
                <Link
                  href={`/${locale}/login`}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[var(--nago-gold)] transition hover:bg-[var(--nago-gold)]/10"
                  aria-label={dict.nav.login}
                >
                  <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                  <span className="sr-only md:not-sr-only md:ml-1 md:hidden lg:inline lg:text-xs lg:font-semibold">
                    {dict.nav.login}
                  </span>
                </Link>
              )}
            </nav>
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-[var(--nago-ink)] md:hidden"
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
        <NagoSiteHeaderMobileNav
          locale={locale}
          open={open}
          onClose={() => setOpen(false)}
          links={links}
          activeHref={activeHref}
          dict={dict}
          sessionEmail={sessionEmail}
          agendaHref={`/${locale}/register`}
          agendaLabel={labels.agendaCta}
        />
      </header>
      {overlayHero ? null : (
        <div className="nago-site-header-spacer" style={{ height: spacerPx }} aria-hidden />
      )}
    </>
  );
}
