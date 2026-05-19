"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { SignOutButton } from "@/components/molecules/SignOutButton";

interface LandingHeaderProps {
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  sessionEmail: string | null;
}

const stroke = 1.75;

const sectionLinkClass =
  "rounded-[var(--layout-border-radius)] px-2.5 py-1.5 text-[var(--color-foreground)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]";

export function LandingHeader({
  brand,
  dict,
  locale,
  sessionEmail,
}: LandingHeaderProps) {
  const [open, setOpen] = useState(false);
  const bypassLogoOptimizer = brand.logoPath.startsWith("/images/");
  const prefix = `/${locale}`;
  const sectionLinks = [
    { href: `${prefix}#historia`, label: dict.nav.about },
    { href: `${prefix}#modalidades`, label: dict.nav.modalities },
    { href: `${prefix}#niveles`, label: dict.nav.courses },
    { href: `${prefix}#certificaciones`, label: dict.nav.certifications },
    { href: `${prefix}#contacto`, label: dict.nav.contact },
  ];

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--color-border)]/80 bg-[var(--color-surface)]/90 shadow-[var(--shadow-soft)] backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex max-w-[var(--layout-max-width)] items-center justify-between gap-3 px-[max(1rem,env(safe-area-inset-left))] py-3.5 pe-[max(1rem,env(safe-area-inset-right))]">
        <Link
          href={prefix}
          className="group flex min-w-0 shrink-0 items-center gap-3 rounded-[var(--layout-border-radius)] outline-none ring-[var(--color-primary)] transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <div className="shrink-0 rounded-[var(--layout-border-radius)] bg-white p-1.5 shadow-sm ring-1 ring-[var(--color-border)] transition group-hover:ring-[var(--color-accent)]/50">
            <Image
              src={brand.logoPath}
              alt={brand.logoAlt || brand.name}
              width={48}
              height={48}
              unoptimized={bypassLogoOptimizer}
              className="block h-9 w-9 rounded-[var(--layout-border-radius)] object-contain"
              priority
            />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-[var(--color-primary)]">
            {brand.name}
          </span>
        </Link>

        <nav
          aria-label={dict.nav.sectionsAria}
          className="hidden min-w-0 flex-1 flex-nowrap items-center justify-center gap-0.5 lg:flex"
        >
          <span className="hidden pr-2 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] xl:inline">
            {dict.nav.sectionsKicker}
          </span>
          {sessionEmail ? (
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--layout-border-radius)] border border-[var(--color-accent)]/55 bg-[color-mix(in_srgb,var(--color-accent)_26%,var(--color-surface))] px-2.5 py-1.5 text-sm font-semibold text-[var(--color-accent-foreground)] shadow-sm transition hover:border-[var(--color-accent)]/80 hover:bg-[color-mix(in_srgb,var(--color-accent)_42%,var(--color-surface))]"
            >
              <LayoutDashboard
                className="h-3.5 w-3.5 shrink-0 opacity-95"
                aria-hidden
                strokeWidth={2}
              />
              {dict.nav.administration}
            </Link>
          ) : null}
          {sectionLinks.map(({ href, label }) => (
            <a key={href} href={href} className={sectionLinkClass}>
              {label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <nav
            aria-label={dict.nav.accountAria}
            className="flex shrink-0 flex-nowrap items-center gap-2 sm:gap-2.5"
          >
            {sessionEmail ? (
              <div className="flex max-w-full items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)]/80 bg-[var(--color-surface)] px-2 py-1 shadow-sm sm:px-3">
                <span
                  className="hidden max-w-[10rem] truncate text-sm text-[var(--color-muted-foreground)] md:inline"
                  title={sessionEmail}
                >
                  {sessionEmail}
                </span>
                <SignOutButton
                  locale={locale}
                  label={dict.nav.logout}
                  className="rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-muted)] active:scale-[0.98] sm:px-4"
                />
              </div>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 font-medium text-[var(--color-primary-foreground)] shadow-md transition hover:bg-[var(--color-primary-dark)] active:scale-[0.98]"
              >
                <LogIn
                  className="h-4 w-4 opacity-90"
                  aria-hidden
                  strokeWidth={stroke}
                />
                <span className="hidden sm:inline">{dict.nav.login}</span>
              </Link>
            )}
          </nav>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 text-[var(--color-primary)] transition hover:bg-[var(--color-muted)] lg:hidden"
            aria-expanded={open}
            aria-controls="ge-mobile-nav"
            aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
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
        <div
          id="ge-mobile-nav"
          className="border-t border-[var(--color-border)]/80 bg-[var(--color-surface)] px-[max(1rem,env(safe-area-inset-left))] py-3 pe-[max(1rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <nav aria-label={dict.nav.sectionsAria}>
            <ul className="flex flex-col gap-1">
              {sectionLinks.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="flex min-h-[48px] items-center rounded-[var(--layout-border-radius)] px-2 py-2 text-base font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {sessionEmail ? (
            <div
              className="mt-3 flex flex-col gap-2 border-t border-[var(--color-border)] pt-3"
              role="group"
              aria-label={dict.nav.accountAria}
            >
              <Link
                href={`/${locale}/dashboard`}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                {dict.nav.administration}
              </Link>
              <SignOutButton
                locale={locale}
                label={dict.nav.logout}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--color-primary)]"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
