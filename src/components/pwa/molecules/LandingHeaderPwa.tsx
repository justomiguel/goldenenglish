"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { SignOutButton } from "@/components/molecules/SignOutButton";

interface LandingHeaderPwaProps {
  brand: BrandPublic;
  dict: Dictionary;
  locale: string;
  sessionEmail: string | null;
}

const stroke = 1.75;

export function LandingHeaderPwa({
  brand,
  dict,
  locale,
  sessionEmail,
}: LandingHeaderPwaProps) {
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
      className="sticky top-0 z-50 border-b border-[var(--color-border)]/70 bg-[var(--color-surface)]/95 shadow-[0_1px_0_color-mix(in_srgb,var(--color-border)_60%,transparent)] backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex max-w-[var(--layout-max-width)] items-center justify-between gap-3 px-[max(1rem,env(safe-area-inset-left))] pb-2.5 pt-2 pe-[max(1rem,env(safe-area-inset-right))]">
        <Link
          href={prefix}
          className="group flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-[var(--layout-border-radius)] py-0.5 outline-none ring-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label={brand.name}
        >
          <div className="shrink-0 rounded-[var(--layout-border-radius)] bg-[var(--color-surface)] p-1 shadow-sm ring-1 ring-[var(--color-border)]">
            <Image
              src={brand.logoPath}
              alt=""
              width={40}
              height={40}
              unoptimized={bypassLogoOptimizer}
              className="block h-9 w-9 rounded-[var(--layout-border-radius)] object-contain"
              priority
            />
          </div>
          <span className="font-display truncate text-[0.9375rem] font-semibold leading-tight tracking-tight text-[var(--color-primary)]">
            {brand.name}
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <nav
            aria-label={dict.nav.accountAria}
            className="flex shrink-0 items-center gap-2"
          >
            {sessionEmail ? (
              <SignOutButton
                locale={locale}
                label={dict.nav.logout}
                title={dict.nav.logout}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--color-primary)]/35 bg-[var(--color-surface)] px-3.5 text-[0.8125rem] font-semibold text-[var(--color-primary)] shadow-sm transition active:scale-[0.98] active:bg-[var(--color-muted)]"
              />
            ) : (
              <Link
                href={`/${locale}/login`}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3.5 text-[0.8125rem] font-semibold text-[var(--color-primary-foreground)] shadow-[0_4px_16px_-6px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] transition active:scale-[0.98] active:brightness-95"
              >
                <LogIn className="h-4 w-4" aria-hidden strokeWidth={stroke} />
                <span>{dict.nav.login}</span>
              </Link>
            )}
          </nav>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/40 text-[var(--color-primary)] transition active:scale-[0.98] active:bg-[var(--color-muted)]"
            aria-expanded={open}
            aria-controls="ge-pwa-mobile-nav"
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
          id="ge-pwa-mobile-nav"
          className="border-t border-[var(--color-border)]/70 bg-[color-mix(in_srgb,var(--color-muted)_28%,var(--color-surface))] px-[max(1rem,env(safe-area-inset-left))] py-3 pe-[max(1rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <nav aria-label={dict.nav.sectionsAria}>
            <ul className="flex flex-col gap-1">
              {sectionLinks.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="flex min-h-[48px] items-center rounded-[var(--layout-border-radius)] px-2 py-2 text-base font-semibold text-[var(--color-foreground)] transition active:bg-[var(--color-muted)] active:text-[var(--color-primary)]"
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
              className="mt-3 flex flex-col gap-2 border-t border-[var(--color-border)]/70 pt-3"
              role="group"
              aria-label={dict.nav.accountAria}
            >
              <Link
                href={`/${locale}/dashboard`}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-sm active:scale-[0.98]"
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                {dict.nav.administration}
              </Link>
              <SignOutButton
                locale={locale}
                label={dict.nav.logout}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[var(--color-primary)]/35 bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] active:scale-[0.98]"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
