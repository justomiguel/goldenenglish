import type { ReactNode } from "react";
import {
  Activity,
  Gift,
  Home,
  MessageCircle,
  Palette,
  Settings,
  Ticket,
  Users,
  Banknote,
  ClipboardList,
  Calendar,
  CalendarDays,
  Inbox,
  TriangleAlert,
  Mail,
  User,
} from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export type AdminSidebarNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  tip?: string;
};

export type AdminSidebarNavGroup = {
  label: string | null;
  items: AdminSidebarNavItem[];
};

const ic = "h-4 w-4 shrink-0 opacity-80";

interface BuildAdminSidebarNavGroupsOptions {
  financeHref?: string;
}

export function buildAdminSidebarNavGroups(
  base: string,
  profileHref: string,
  dict: Dictionary["dashboard"]["adminNav"],
  badge: number,
  options: BuildAdminSidebarNavGroupsOptions = {},
): AdminSidebarNavGroup[] {
  const financeHref = options.financeHref ?? `${base}/finance`;

  return [
    {
      label: dict.navScopeInstitution,
      items: [{ href: base, label: dict.home, icon: <Home className={ic} />, tip: dict.tipHome }],
    },
    {
      label: dict.groupPeople,
      items: [
        {
          href: `${base}/users`,
          label: dict.users,
          icon: <Users className={ic} />,
          tip: dict.tipUsers,
        },
        {
          href: `${base}/registrations`,
          label: dict.registrations,
          icon: <ClipboardList className={ic} />,
          badge,
          tip: dict.tipRegistrations,
        },
      ],
    },
    {
      label: null,
      items: [
        {
          href: financeHref,
          label: dict.finance,
          icon: <Banknote className={ic} />,
          tip: dict.tipFinance,
        },
      ],
    },
    {
      label: dict.groupAcademic,
      items: [
        {
          href: `${base}/academic`,
          label: dict.academics,
          icon: <CalendarDays className={ic} />,
          tip: dict.tipAcademics,
        },
        {
          href: `${base}/calendar`,
          label: dict.calendar,
          icon: <Calendar className={ic} />,
          tip: dict.tipCalendar,
        },
        {
          href: `${base}/requests`,
          label: dict.transferInboxNav,
          icon: <Inbox className={ic} />,
          tip: dict.tipTransferInbox,
        },
        {
          href: `${base}/retention`,
          label: dict.retention,
          icon: <TriangleAlert className={ic} />,
          tip: dict.tipRetention,
        },
      ],
    },
    {
      label: dict.groupMarketing,
      items: [
        {
          href: `${base}/coupons`,
          label: dict.coupons,
          icon: <Ticket className={ic} />,
          tip: dict.tipCoupons,
        },
        {
          href: `${base}/promotions`,
          label: dict.promotions,
          icon: <Gift className={ic} />,
          tip: dict.tipPromotions,
        },
      ],
    },
    {
      label: dict.groupComms,
      items: [
        {
          href: `${base}/messages`,
          label: dict.messages,
          icon: <MessageCircle className={ic} />,
          tip: dict.tipMessages,
        },
        {
          href: `${base}/communications/templates`,
          label: dict.emailTemplates,
          icon: <Mail className={ic} />,
          tip: dict.tipEmailTemplates,
        },
      ],
    },
    {
      label: null,
      items: [
        {
          href: `${base}/analytics`,
          label: dict.analytics,
          icon: <Activity className={ic} />,
          tip: dict.tipAnalytics,
        },
        {
          href: `${base}/cms`,
          label: dict.cms,
          icon: <Palette className={ic} />,
          tip: dict.tipCms,
        },
        {
          href: `${base}/settings`,
          label: dict.settings,
          icon: <Settings className={ic} />,
          tip: dict.tipSettings,
        },
        {
          href: profileHref,
          label: dict.myProfile,
          icon: <User className={ic} />,
          tip: dict.tipMyProfile,
        },
      ],
    },
  ];
}
