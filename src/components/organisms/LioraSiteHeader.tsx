"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, LogIn, Menu, MessageCircle, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { PublicHeaderAccountCta } from "@/components/molecules/PublicHeaderAccountCta";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import { PUBLIC_MARKETING_CHROME_CLASS } from "@/lib/theme/publicExperienceNav";
import { BrandInstagramIcon } from "@/components/atoms/BrandSocialIcons";
import { LioraLockup } from "@/components/molecules/LioraLockup";
import { useScrolledPast } from "@/hooks/useScrolledPast";

export interface LioraSiteHeaderProps {
  locale: string;
  /** Brand name from the brand layer; drawn as the horizontal lockup. */
  brandName: string;
  /** Accessible name of the home link. */
  logoAlt: string;
  dict: Dictionary;
  sessionEmail: string | null;
  showBlogLink?: boolean;
  blogLabel?: string;
  showShopLink?: boolean;
  shopLabel?: string;
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
  brandName,
  logoAlt,
  dict,
  sessionEmail,
  showBlogLink = false,
  blogLabel,
  showShopLink = false,
  shopLabel,
  showEventsLink = true,
  eventsLabel,
  instagramUrl,
  whatsappUrl,
  labels,
}: LioraSiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const { sentinelRef, scrolledPast } = useScrolledPast();
  const motto = marketingLandingCopy(dict, "liora", "chrome.motto").trim();
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
    ...(showBlogLink && blogLabel ? [{ href: `${prefix}/blog`, label: blogLabel }] : []),
    ...(showShopLink && shopLabel ? [{ href: `${prefix}/tienda`, label: shopLabel }] : []),
    { href: `${prefix}#contacto`, label: labels.contacto },
  ];

  return (
    <>
    <span ref={sentinelRef} aria-hidden className="block h-0" />
    <header
      id="top"
      data-scrolled={scrolledPast ? "true" : "false"}
      className={`${PUBLIC_MARKETING_CHROME_CLASS} sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-500 ease-[var(--liora-ease)] ${scrolledPast ? "border-[var(--liora-line)] bg-[color-mix(in_srgb,var(--liora-cream)_94%,transparent)] shadow-[0_10px_30px_-24px_rgb(184_79_97/0.6)] backdrop-blur-md" : "border-transparent bg-[var(--liora-cream)]"}`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-2 px-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))] transition-[padding] duration-500 md:gap-3 lg:gap-4 ${scrolledPast ? "py-1.5" : "py-3 lg:py-4"}`}>
        <Link href={prefix} className="min-w-0 shrink overflow-hidden xl:shrink-0 xl:overflow-visible" aria-label={logoAlt}>
          <LioraLockup brandName={brandName} motto={motto} compact={scrolledPast} />
        </Link>
        <nav
          className="hidden items-center xl:flex"
          aria-label={dict.nav.sectionsAria}
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-[44px] items-center px-2.5 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--liora-ink)] transition-colors hover:text-[var(--liora-rose-text)] xl:px-3"
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
              className="hidden h-11 w-11 items-center justify-center rounded-full text-[var(--liora-rose-deep)] transition-colors hover:bg-[color-mix(in_srgb,var(--liora-rose)_18%,transparent)] 2xl:inline-flex"
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
              className="hidden h-11 w-11 items-center justify-center rounded-full text-[var(--liora-rose-deep)] transition-colors hover:bg-[color-mix(in_srgb,var(--liora-rose)_18%,transparent)] 2xl:inline-flex"
              aria-label={waAria}
            >
              <MessageCircle className="h-5 w-5" aria-hidden strokeWidth={stroke} />
            </a>
          ) : null}
          {/* Below md the tab bar owns the account entry. */}
          <nav
            aria-label={dict.nav.accountAria}
            className="hidden shrink-0 items-center gap-1.5 sm:gap-2 md:flex"
          >
            <PublicHeaderAccountCta
              locale={locale}
              sessionEmail={sessionEmail}
              loginLabel={dict.nav.login}
              loginShort={dict.nav.loginShort}
              portalLabel={dict.nav.myPortal}
              logoutLabel={dict.nav.logout}
              tone="liora"
              showLogout
            />
          </nav>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--liora-rose-deep)]/35 bg-white text-[var(--liora-rose-deep)] xl:hidden"
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
          className="border-t border-[var(--liora-line)] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] xl:hidden"
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
                  {dict.nav.myPortal}
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
    </>
  );
}
