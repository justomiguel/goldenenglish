"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { Menu, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { MatissLockup } from "@/variants/owned/matiss/lockup/v1/Web";
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
  placement?: "sticky" | "fixed";
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
  placement = "sticky",
}: MatissSiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const { sentinelRef, scrolledPast } = useScrolledPast();
  const dense = placement === "fixed" || scrolledPast;

  function followHash(event: MouseEvent<HTMLAnchorElement>, href: string) {
    const mark = href.indexOf("#");
    if (mark < 0) return;
    const node = document.getElementById(href.slice(mark + 1));
    const screen = node?.closest(".matiss-phone-screen");
    if (!(screen instanceof HTMLElement)) return;
    event.preventDefault();
    screen.scrollIntoView({ block: "start" });
    window.history.replaceState(null, "", `#${href.slice(mark + 1)}`);
    setOpen(false);
  }
  const surface = dense
    ? "bg-[color-mix(in_srgb,var(--ds-color-background)_97%,transparent)] shadow-[0_10px_30px_-18px_var(--ds-color-primary)]"
    : "bg-[color-mix(in_srgb,var(--ds-color-background)_88%,transparent)]";

  return (
    <>
      <span ref={sentinelRef} aria-hidden className="block h-0" />
      <header
        id="top"
        data-scrolled={dense ? "true" : "false"}
        className={`${PUBLIC_MARKETING_CHROME_CLASS} ${placement === "fixed" ? "fixed inset-x-0 top-0" : "sticky top-0"} z-50 border-b border-[var(--owned-line)] backdrop-blur-md transition-[background-color,box-shadow] duration-300 ${surface}`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between gap-3 px-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))] transition-[padding] duration-300 ${dense ? "py-1.5" : "py-3"}`}
        >
          <Link href={`/${locale}`} className="inline-flex min-h-[44px] shrink-0 items-center" aria-label={logoAlt}>
            <MatissLockup brandName={brandName} compact={dense} />
          </Link>
          <nav className="hidden items-center lg:flex" aria-label={dict.nav.sectionsAria}>
            {links.map(({ href, label }) => (
              <Link key={href} href={href} onClick={(event) => followHash(event, href)} className="inline-flex min-h-[44px] items-center px-3 text-sm font-semibold text-[var(--ds-color-foreground)] hover:text-[var(--ds-color-primary)]">
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
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--owned-line)] bg-white text-[var(--ds-color-primary)] lg:hidden"
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
          <nav id="matiss-mobile-nav" aria-label={dict.nav.sectionsAria} className="border-t border-[var(--owned-line)] bg-white px-4 py-2 lg:hidden">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} onClick={(event) => { followHash(event, href); setOpen(false); }} className="flex min-h-[44px] items-center text-sm font-semibold text-[var(--ds-color-foreground)]">
                {label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
    </>
  );
}

export default MatissSiteHeader;
