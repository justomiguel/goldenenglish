import type { ReactNode } from "react";
import { Calendar, Home, MessageCircle, Settings, TrendingUp, User, Wallet } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export type ParentSidebarNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  tip?: string;
};

export type ParentSidebarNavGroup = {
  label: string | null;
  items: ParentSidebarNavItem[];
};

const ic = "h-4 w-4 shrink-0 opacity-80";

export function buildParentSidebarNavGroups(
  base: string,
  profileHref: string,
  dict: Dictionary["dashboard"]["parentNav"],
  options?: { includePayments?: boolean },
): ParentSidebarNavGroup[] {
  const includePayments = options?.includePayments ?? true;

  const mainItems: ParentSidebarNavItem[] = [
    {
      href: `${base}/calendar`,
      label: dict.calendar,
      icon: <Calendar className={ic} aria-hidden />,
      tip: dict.tipCalendar,
    },
    {
      href: `${base}/progress`,
      label: dict.progress,
      icon: <TrendingUp className={ic} aria-hidden />,
      tip: dict.tipProgress,
    },
  ];

  if (includePayments) {
    mainItems.push({
      href: `${base}/payments`,
      label: dict.payments,
      icon: <Wallet className={ic} aria-hidden />,
      tip: dict.tipPayments,
    });
  }

  mainItems.push({
    href: `${base}/messages`,
    label: dict.messages,
    icon: <MessageCircle className={ic} aria-hidden />,
    tip: dict.tipMessages,
  });

  return [
    {
      label: dict.navScopeStudent,
      items: [
        {
          href: base,
          label: dict.home,
          icon: <Home className={ic} aria-hidden />,
          tip: dict.tipHome,
        },
      ],
    },
    {
      label: null,
      items: mainItems,
    },
    {
      label: dict.groupYou,
      items: [
        {
          href: `${base}/settings`,
          label: dict.settings,
          icon: <Settings className={ic} aria-hidden />,
          tip: dict.tipSettings,
        },
        {
          href: profileHref,
          label: dict.myProfile,
          icon: <User className={ic} aria-hidden />,
          tip: dict.tipMyProfile,
        },
      ],
    },
  ];
}
