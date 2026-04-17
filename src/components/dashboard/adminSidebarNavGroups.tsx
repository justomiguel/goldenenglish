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
  Wallet,
  ClipboardList,
  Calendar,
  CalendarDays,
  Inbox,
  TriangleAlert,
  FileText,
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

export function buildAdminSidebarNavGroups(
  base: string,
  profileHref: string,
  dict: Dictionary["dashboard"]["adminNav"],
  badge: number,
): AdminSidebarNavGroup[] {
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
      label: dict.groupFinance,
      items: [
        {
          href: `${base}/payments`,
          label: dict.payments,
          icon: <Wallet className={ic} />,
          tip: dict.tipPayments,
        },
        {
          href: `${base}/finance/receipts`,
          label: dict.financeReceipts,
          icon: <FileText className={ic} />,
          tip: dict.tipFinanceReceipts,
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
