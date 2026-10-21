"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleDollarSign, ClipboardList, LayoutDashboard, LayoutGrid, Users } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { useAdminMobileShell } from "@/components/dashboard/AdminMobileShellContext";
import {
  adminBasePath,
  adminFinanceHrefForPathname,
  formatAdminPwaBadgeCount,
  resolveAdminPwaTabActive,
  type AdminPwaTabId,
} from "@/lib/dashboard/resolveAdminPwaTabActive";

export interface AdminPwaTabBarProps {
  locale: string;
  dict: Dictionary["dashboard"]["adminNav"];
  newRegistrationsCount: number;
  recentInboundMessagesCount: number;
}

const iconClass = "h-5 w-5 shrink-0";

export function AdminPwaTabBar({
  locale,
  dict,
  newRegistrationsCount,
  recentInboundMessagesCount,
}: AdminPwaTabBarProps) {
  const pathname = usePathname() ?? "";
  const shell = useAdminMobileShell();
  const base = adminBasePath(locale);
  const active = resolveAdminPwaTabActive(pathname, locale);
  const registrationsBadge = formatAdminPwaBadgeCount(newRegistrationsCount);
  const messagesBadge = formatAdminPwaBadgeCount(recentInboundMessagesCount);

  const linkClass = (id: AdminPwaTabId) =>
    `flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-[var(--layout-border-radius)] px-1 py-1 text-[0.6875rem] font-semibold leading-tight transition-colors ${
      active === id
        ? "text-[var(--color-primary)]"
        : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
    }`;

  return (
    <nav
      aria-label={dict.pwaTabBarAria}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <ul className="mx-auto flex max-w-[var(--layout-max-width)] items-stretch justify-around px-1 pt-1">
        <li className="min-w-0 flex-1">
          <Link href={base} aria-current={active === "home" ? "page" : undefined} className={linkClass("home")}>
            <LayoutDashboard className={iconClass} aria-hidden />
            <span className="max-w-full truncate">{dict.pwaTabHome}</span>
          </Link>
        </li>
        <li className="min-w-0 flex-1">
          <Link
            href={`${base}/registrations`}
            aria-current={active === "registrations" ? "page" : undefined}
            className={linkClass("registrations")}
          >
            <span className="relative">
              <ClipboardList className={iconClass} aria-hidden />
              {registrationsBadge ? (
                <span className="absolute -right-3 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-secondary)] px-1 text-[0.6rem] font-bold leading-none text-[var(--color-secondary-foreground)]">
                  {registrationsBadge}
                </span>
              ) : null}
            </span>
            <span className="max-w-full truncate">{dict.pwaTabRegistrations}</span>
          </Link>
        </li>
        <li className="min-w-0 flex-1">
          <Link
            href={adminFinanceHrefForPathname(base, pathname)}
            aria-current={active === "finance" ? "page" : undefined}
            className={linkClass("finance")}
          >
            <CircleDollarSign className={iconClass} aria-hidden />
            <span className="max-w-full truncate">{dict.pwaTabFinance}</span>
          </Link>
        </li>
        <li className="min-w-0 flex-1">
          <Link
            href={`${base}/students`}
            aria-current={active === "people" ? "page" : undefined}
            className={linkClass("people")}
          >
            <Users className={iconClass} aria-hidden />
            <span className="max-w-full truncate">{dict.pwaTabPeople}</span>
          </Link>
        </li>
        <li className="min-w-0 flex-1">
          <button
            type="button"
            aria-expanded={shell?.open ?? false}
            aria-current={active === "more" ? "page" : undefined}
            onClick={() => shell?.openDrawer()}
            className={linkClass("more")}
          >
            <span className="relative">
              <LayoutGrid className={iconClass} aria-hidden />
              {messagesBadge ? (
                <span className="absolute -right-3 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-secondary)] px-1 text-[0.6rem] font-bold leading-none text-[var(--color-secondary-foreground)]">
                  {messagesBadge}
                </span>
              ) : null}
            </span>
            <span className="max-w-full truncate">{dict.pwaTabMore}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
