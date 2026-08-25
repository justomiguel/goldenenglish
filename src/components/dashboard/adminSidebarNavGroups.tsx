import type { Dictionary } from "@/types/i18n";
import {
  buildAdminDailyNavItems,
  type AdminSidebarNavItem,
  type AdminSidebarNavBadges,
} from "@/lib/dashboard/buildAdminDailyNavItems";

export type { AdminSidebarNavItem, AdminSidebarNavBadges };

export type AdminSidebarNavGroup = {
  label: string | null;
  items: AdminSidebarNavItem[];
};

interface BuildAdminSidebarNavGroupsOptions {
  financeHref?: string;
  includeEmailTemplatesNav?: boolean;
  includeBlogNav?: boolean;
}

export function buildAdminSidebarNavGroups(
  base: string,
  _profileHref: string,
  dict: Dictionary["dashboard"]["adminNav"],
  badges: AdminSidebarNavBadges,
  options: BuildAdminSidebarNavGroupsOptions = {},
): AdminSidebarNavGroup[] {
  return [
    {
      label: dict.navScopeInstitution,
      items: buildAdminDailyNavItems(base, dict, badges, {
        financeHref: options.financeHref,
      }),
    },
  ];
}
