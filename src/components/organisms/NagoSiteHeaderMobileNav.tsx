"use client";

import Link from "next/link";
import { LayoutDashboard, LogIn } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { SignOutButton } from "@/components/molecules/SignOutButton";

const stroke = 1.75;

export function NagoSiteHeaderMobileNav({
  locale,
  open,
  onClose,
  links,
  activeHref,
  dict,
  sessionEmail,
}: {
  locale: string;
  open: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
  activeHref: string;
  dict: Dictionary;
  sessionEmail: string | null;
}) {
  return (
    <div
      id="nago-mobile-nav"
      className={`nago-mobile-drawer lg:hidden${open ? " is-open" : ""}`}
      aria-hidden={!open}
    >
      <div className="nago-mobile-drawer-inner border-t border-[var(--nago-gold)]/20 bg-black px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <nav aria-label={dict.nav.sectionsAria}>
          <ul className="flex flex-col gap-0.5">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={href === activeHref ? "page" : undefined}
                  className={`flex min-h-[44px] items-center rounded-lg px-2 py-2 text-sm font-semibold uppercase text-[var(--nago-ink)] hover:bg-[var(--nago-gold)]/10 hover:text-[var(--nago-gold)]${href === activeHref ? " is-active text-[var(--nago-gold)]" : ""}`}
                  onClick={onClose}
                  tabIndex={open ? undefined : -1}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div
          className="mt-3 flex flex-col gap-2 border-t border-[var(--nago-gold)]/20 pt-3"
          role="group"
          aria-label={dict.nav.accountAria}
        >
          {sessionEmail ? (
            <>
              <Link
                href={`/${locale}/dashboard`}
                className="nago-btn nago-btn-solid w-full"
                onClick={onClose}
                tabIndex={open ? undefined : -1}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
                {dict.nav.administration}
              </Link>
              <SignOutButton locale={locale} label={dict.nav.logout} className="nago-btn w-full" />
            </>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="nago-btn nago-btn-solid w-full"
              onClick={onClose}
              tabIndex={open ? undefined : -1}
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={stroke} />
              {dict.nav.login}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
