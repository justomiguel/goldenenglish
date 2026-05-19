"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, MessageCircle, Settings, TrendingUp, Wallet } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export type ParentPwaTabId =
  | "home"
  | "schedule"
  | "progress"
  | "payments"
  | "messages"
  | "settings";

export function resolveParentPwaTab(pathname: string, baseHref: string): ParentPwaTabId {
  if (pathname.startsWith(`${baseHref}/calendar`)) return "schedule";
  if (
    pathname.startsWith(`${baseHref}/progress`) ||
    pathname.startsWith(`${baseHref}/tasks`) ||
    pathname.startsWith(`${baseHref}/assessments`) ||
    pathname.startsWith(`${baseHref}/badges`)
  ) {
    return "progress";
  }
  if (pathname.startsWith(`${baseHref}/payments`) || pathname.startsWith(`${baseHref}/billing`)) {
    return "payments";
  }
  if (pathname.startsWith(`${baseHref}/messages`)) return "messages";
  if (pathname.startsWith(`${baseHref}/settings`)) return "settings";
  return "home";
}

interface ParentPwaTabBarProps {
  locale: string;
  dict: Dictionary["dashboard"]["parentNav"];
  baseHref?: string;
}

const tabIconClass = "h-5 w-5 shrink-0";

export function ParentPwaTabBar({ locale, dict, baseHref = `/${locale}/dashboard/parent` }: ParentPwaTabBarProps) {
  const pathname = usePathname();
  const active = resolveParentPwaTab(pathname, baseHref);

  const tabs: { id: ParentPwaTabId; href: string; label: string; icon: React.ReactNode }[] = [
    { id: "home", href: baseHref, label: dict.home, icon: <Home className={tabIconClass} aria-hidden /> },
    {
      id: "schedule",
      href: `${baseHref}/calendar`,
      label: dict.calendar,
      icon: <Calendar className={tabIconClass} aria-hidden />,
    },
    {
      id: "progress",
      href: `${baseHref}/progress`,
      label: dict.progress,
      icon: <TrendingUp className={tabIconClass} aria-hidden />,
    },
    {
      id: "payments",
      href: `${baseHref}/payments`,
      label: dict.payments,
      icon: <Wallet className={tabIconClass} aria-hidden />,
    },
    {
      id: "messages",
      href: `${baseHref}/messages`,
      label: dict.messages,
      icon: <MessageCircle className={tabIconClass} aria-hidden />,
    },
    {
      id: "settings",
      href: `${baseHref}/settings`,
      label: dict.settings,
      icon: <Settings className={tabIconClass} aria-hidden />,
    },
  ];

  return (
    <nav
      aria-label={dict.pwaTabBarAria}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-[0_-4px_24px_color-mix(in_oklch,var(--color-foreground)_8%,transparent)] backdrop-blur-md"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <ul className="mx-auto flex max-w-[var(--layout-max-width)] items-stretch justify-around px-1 pt-1">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <li key={tab.id} className="min-w-0 flex-1">
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-[var(--layout-border-radius)] px-1 py-1.5 text-[0.625rem] font-semibold leading-tight transition ${
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {tab.icon}
                <span className="max-w-full truncate">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
