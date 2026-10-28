import type { Dictionary } from "@/types/i18n";
import {
  buildAdminDailyNavItems,
  type AdminSidebarNavBadges,
  type AdminSidebarNavItem,
  type BuildAdminDailyNavItemsOptions,
} from "@/lib/dashboard/buildAdminDailyNavItems";

export type AdminHamburgerMenuOptions = BuildAdminDailyNavItemsOptions & {
  financeHref: string;
  query?: string;
};

function pathOnly(href: string): string {
  const queryAt = href.indexOf("?");
  return queryAt === -1 ? href : href.slice(0, queryAt);
}

function isTabBarDestination(item: AdminSidebarNavItem, base: string, financeHref: string): boolean {
  const path = pathOnly(item.href);
  if (path === base || path === `${base}/`) return true;
  if (path === `${base}/students` || path.startsWith(`${base}/students/`)) return true;
  if (path === `${base}/registrations` || path.startsWith(`${base}/registrations/`)) return true;
  const financePath = pathOnly(financeHref);
  return path === financePath || path === `${base}/finance` || path.startsWith(`${base}/finance/`);
}

function matchesQuery(label: string, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  return label.toLocaleLowerCase().includes(needle);
}

export function buildAdminHamburgerMenuItems(
  base: string,
  dict: Dictionary["dashboard"]["adminNav"],
  badges: AdminSidebarNavBadges,
  options: AdminHamburgerMenuOptions,
): AdminSidebarNavItem[] {
  const items = buildAdminDailyNavItems(base, dict, badges, {
    financeHref: options.financeHref,
    includeBlogNav: options.includeBlogNav,
    includeMerchNav: options.includeMerchNav,
  });
  const query = options.query ?? "";
  return items.filter(
    (item) => !isTabBarDestination(item, base, options.financeHref) && matchesQuery(item.label, query),
  );
}
