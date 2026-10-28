"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import { StaffSidebarBrand } from "@/components/dashboard/StaffSidebarBrand";
import type { BrandPublic } from "@/lib/brand/server";
import { buildAdminHamburgerMenuItems } from "@/lib/dashboard/adminHamburgerMenuItems";
import { adminFinanceHrefForPathname } from "@/lib/dashboard/resolveAdminPwaTabActive";
import { isAdminSidebarNavItemActive } from "@/lib/dashboard/adminSidebarNavActive";
import { adminSurfaceIcon } from "@/lib/dashboard/adminSurfaceIcon";
import { useAdminPersonRecordRole } from "@/hooks/useAdminPersonRecordRole";

export interface AdminHamburgerMenuProps {
  locale: string;
  dict: Dictionary;
  newRegistrationsCount: number;
  recentInboundMessagesCount: number;
  includeBlogNav?: boolean;
  includeMerchNav?: boolean;
  profileDisplayName: string;
  profileRoleLabel: string;
  profileAvatarUrl: string | null;
  brand?: BrandPublic;
  onClose: () => void;
}

function badgeLabel(count: number | undefined): string | null {
  if (!count || count <= 0) return null;
  if (count > 99) return "99+";
  return String(count);
}

export function AdminHamburgerMenu({
  locale,
  dict,
  newRegistrationsCount,
  recentInboundMessagesCount,
  includeBlogNav = false,
  includeMerchNav = false,
  profileDisplayName,
  profileRoleLabel,
  profileAvatarUrl,
  brand,
  onClose,
}: AdminHamburgerMenuProps) {
  const navDict = dict.dashboard.adminNav;
  const chromeDict = dict.dashboard.adminChrome;
  const pathname = usePathname() ?? "";
  const base = `/${locale}/dashboard/admin`;
  const profileHref = `/${locale}/dashboard/profile`;
  const searchId = useId();
  const [query, setQuery] = useState("");
  const personRecordRole = useAdminPersonRecordRole(pathname, base);
  const financeHref = adminFinanceHrefForPathname(base, pathname);
  const items = buildAdminHamburgerMenuItems(
    base,
    navDict,
    {
      newRegistrations: newRegistrationsCount,
      recentInboundMessages: recentInboundMessagesCount,
    },
    { financeHref, includeBlogNav, includeMerchNav, query },
  );
  const hrefs = items.map((item) => item.href);
  const showPerson = Boolean(profileDisplayName || profileRoleLabel);
  const initial = (profileDisplayName || profileRoleLabel).trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="mx-auto flex h-dvh max-h-dvh max-w-[var(--layout-max-width)] flex-col overflow-hidden bg-[var(--color-background)] px-safe pb-safe pt-safe text-[var(--color-foreground)]">
      <div
        className={
          brand
            ? "relative flex min-h-[5.5rem] w-full shrink-[100] grow basis-auto flex-col overflow-hidden"
            : "relative shrink-0"
        }
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={navDict.mobileClose}
          className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        {brand ? (
          <div onClick={onClose} className="flex min-h-0 flex-1 flex-col">
            <StaffSidebarBrand href={base} brand={brand} locale={locale} fit />
          </div>
        ) : (
          <h2 className="px-4 pb-1 pt-4 pr-16 text-lg font-semibold text-[var(--color-foreground)]">
            {navDict.mobileMenuTitle}
          </h2>
        )}
      </div>

      <div className="mt-3 flex shrink-0 items-center gap-3 px-4">
        {showPerson ? (
          <Link
            href={profileHref}
            onClick={onClose}
            aria-label={navDict.myProfile}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-[var(--layout-border-radius)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            {profileAvatarUrl ? (
              // User photo URL. Same exception as the desktop profile row.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileAvatarUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-[var(--color-border)]"
              />
            ) : (
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-sm font-bold text-[var(--color-primary)] ring-1 ring-[var(--color-border)]"
              >
                {initial}
              </span>
            )}
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-semibold">{profileDisplayName}</span>
              <span className="mt-0.5 block truncate text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                {profileRoleLabel}
              </span>
            </span>
          </Link>
        ) : (
          <div className="min-w-0 flex-1" />
        )}
        <LanguageSwitcher locale={locale} labels={dict.common.locale} variant="compact" />
      </div>

      <div className="shrink-0 px-4 pt-3">
        <label htmlFor={searchId} className="sr-only">
          {navDict.mobileMenuSearch}
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={navDict.mobileMenuSearch}
          aria-label={navDict.mobileMenuSearch}
          className="min-h-11 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        />
      </div>

      <div className="mt-3 min-h-0 shrink overflow-y-auto px-4">
        {items.length === 0 ? (
          <p className="px-1 py-6 text-sm text-[var(--color-muted-foreground)]">{navDict.mobileMenuEmpty}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 pb-4">
            {items.map((item) => {
              const active = isAdminSidebarNavItemActive(
                pathname,
                item.href,
                base,
                profileHref,
                hrefs,
                { personRecordRole },
              );
              const count = badgeLabel(item.badge);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    title={item.tip}
                    aria-current={active ? "page" : undefined}
                    {...(item.tourId ? { "data-tour": item.tourId } : {})}
                    className={`flex min-h-11 items-center gap-2 rounded-[var(--layout-border-radius)] border px-3 py-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                      active
                        ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-[var(--color-primary)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                    }`}
                  >
                    {adminSurfaceIcon(item.iconId, "h-5 w-5 shrink-0")}
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {count ? (
                      <span className="rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[0.6rem] font-bold leading-none text-[var(--color-accent-foreground)]">
                        {count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 space-y-2 border-t border-[var(--color-border)] px-4 py-3">
        <Link
          href={`/${locale}`}
          onClick={onClose}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-secondary)] px-4 text-sm font-semibold text-[var(--color-secondary-foreground)] shadow-sm transition-[transform,colors] duration-200 ease-out hover:scale-[1.02] hover:bg-[var(--color-secondary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2 motion-reduce:hover:scale-100"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          <span>{chromeDict.backToSite}</span>
        </Link>
        <SignOutButton
          locale={locale}
          label={dict.nav.logout}
          title={chromeDict.signOutHint}
          className="min-h-12 w-full rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-sm transition-[transform,colors] duration-200 ease-out hover:scale-[1.02] hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 motion-reduce:hover:scale-100"
          iconClassName="h-4 w-4 shrink-0"
        />
      </div>
    </div>
  );
}
