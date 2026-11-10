"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { MatissLockup } from "@/components/molecules/MatissLockup";
import { PublicHeaderAccountCta } from "@/components/molecules/PublicHeaderAccountCta";
import { useScrolledPast } from "@/hooks/useScrolledPast";
import { PUBLIC_MARKETING_CHROME_CLASS } from "@/lib/theme/publicExperienceNav";

export interface MatissSiteHeaderProps {
  locale: string;
  /** `brand.name`. The header lockup is built from it. */
  brandName: string;
  logoAlt: string;
  dict: Dictionary;
  sessionEmail: string | null;
  links: { href: string; label: string }[];
  openMenu: string;
  closeMenu: string;
}

export function MatissSiteHeader({
  locale,
  brandName,
  logoAlt,
  dict,
  sessionEmail,
  links,
  openMenu,
  closeMenu,
}: MatissSiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const { sentinelRef, scrolledPast } = useScrolledPast();
  const surface = scrolledPast
    ? "bg-[color-mix(in_srgb,var(--matiss-paper)_97%,transparent)] shadow-[0_10px_30px_-18px_var(--matiss-violet-deep)]"
    : "bg-[color-mix(in_srgb,var(--matiss-paper)_88%,transparent)]";

  return (
    <>
      <span ref={sentinelRef} aria-hidden className="block h-0" />
      <header
        id="top"
        data-scrolled={scrolledPast ? "true" : "false"}
        className={`${PUBLIC_MARKETING_CHROME_CLASS} sticky top-0 z-50 border-b border-[var(--matiss-line)] backdrop-blur-md transition-[background-color,box-shadow] duration-300 ${surface}`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between gap-3 px-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))] transition-[padding] duration-300 ${scrolledPast ? "py-1.5" : "py-3"}`}
        >
          <Link href={`/${locale}`} className="inline-flex min-h-[44px] shrink-0 items-center" aria-label={logoAlt}>
            <MatissLockup brandName={brandName} compact={scrolledPast} />
          </Link>
          <nav className="hidden items-center lg:flex" aria-label={dict.nav.sectionsAria}>
            {links.map(({ href, label }) => (
              <Link key={href} href={href} className="inline-flex min-h-[44px] items-center px-3 text-sm font-semibold text-[var(--matiss-ink)] hover:text-[var(--matiss-violet-deep)]">
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <PublicHeaderAccountCta
              locale={locale}
              sessionEmail={sessionEmail}
              loginLabel={dict.nav.login}
              loginShort={dict.nav.loginShort}
              portalLabel={dict.nav.myPortal}
              logoutLabel={dict.nav.logout}
              tone="matiss"
              showLogout
            />
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--matiss-line)] bg-white text-[var(--matiss-violet-deep)] lg:hidden"
              aria-expanded={open}
              aria-controls="matiss-mobile-nav"
              aria-label={open ? closeMenu : openMenu}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>
        {open ? (
          <nav id="matiss-mobile-nav" aria-label={dict.nav.sectionsAria} className="border-t border-[var(--matiss-line)] bg-white px-4 py-2 lg:hidden">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="flex min-h-[44px] items-center text-sm font-semibold text-[var(--matiss-ink)]">
                {label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
    </>
  );
}
