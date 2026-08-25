import type { Dictionary } from "@/types/i18n";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import type { AdminSurfaceIconId } from "@/lib/dashboard/adminSurfaceIcon";

export type AdminSidebarNavItem = {
  href: string;
  label: string;
  iconId: AdminSurfaceIconId;
  badge?: number;
  tip?: string;
  tourId?: string;
};

export type AdminSidebarNavBadges = {
  newRegistrations: number;
  recentInboundMessages: number;
};

export type BuildAdminDailyNavItemsOptions = {
  financeHref?: string;
};

export function buildAdminDailyNavItems(
  base: string,
  dict: Dictionary["dashboard"]["adminNav"],
  badges: AdminSidebarNavBadges,
  options: BuildAdminDailyNavItemsOptions = {},
): AdminSidebarNavItem[] {
  const financeHref = options.financeHref ?? `${base}/finance`;
  return [
    { href: base, label: dict.home, iconId: "home", tip: dict.tipHome },
    {
      href: `${base}/students`,
      label: dict.students,
      iconId: "students",
      tip: dict.tipStudents,
      tourId: ADMIN_TOUR_ANCHORS.navUsers,
    },
    {
      href: `${base}/teachers`,
      label: dict.teachers,
      iconId: "teachers",
      tip: dict.tipTeachers,
    },
    {
      href: `${base}/registrations`,
      label: dict.registrations,
      iconId: "registrations",
      badge: badges.newRegistrations,
      tip: dict.tipRegistrations,
    },
    {
      href: `${base}/academic`,
      label: dict.academics,
      iconId: "academic",
      tip: dict.tipAcademics,
      tourId: ADMIN_TOUR_ANCHORS.navAcademic,
    },
    {
      href: financeHref,
      label: dict.finance,
      iconId: "finance",
      tip: dict.tipFinance,
    },
    {
      href: `${base}/messages`,
      label: dict.messages,
      iconId: "messages",
      badge: badges.recentInboundMessages,
      tip: dict.tipMessages,
    },
    {
      href: `${base}/institute`,
      label: dict.institute,
      iconId: "institute",
      tip: dict.tipInstitute,
      tourId: ADMIN_TOUR_ANCHORS.navInstitute,
    },
  ];
}
