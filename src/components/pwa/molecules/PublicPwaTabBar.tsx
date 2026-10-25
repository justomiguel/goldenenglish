"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Home,
  LayoutDashboard,
  LogIn,
  Newspaper,
  ShoppingBag,
  UserPlus,
} from "lucide-react";
import type { PublicExperienceVariant } from "@/lib/theme/publicExperienceNav";

export interface PublicPwaTabLabels {
  home: string;
  courses: string;
  events: string;
  enroll: string;
  shop: string;
  blog: string;
  aria: string;
}

export interface PublicPwaTabBarProps {
  locale: string;
  sessionEmail: string | null;
  variant?: PublicExperienceVariant;
  coursesHref: string;
  coursesLabel: string;
  labels: PublicPwaTabLabels;
  loginLabel: string;
  portalLabel: string;
  inscriptionsEnabled?: boolean;
  merchEnabled?: boolean;
  blogEnabled?: boolean;
}

const BAR: Record<PublicExperienceVariant, string> = {
  default: "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)]",
  mozarthitos: "border-[var(--mz-header-red-deep)]/20 bg-[var(--mz-white)] text-[var(--mz-ink-on-white)]",
  espaciozenit: "border-[var(--ez-cyan)]/35 bg-[var(--color-surface)] text-white",
  nago: "border-[var(--nago-gold)]/35 bg-[var(--nago-bg)] text-[var(--nago-ink-muted)]",
  mimundo: "border-[var(--mm-green)]/30 bg-[var(--mm-cream)] text-[var(--mm-green-dark)]",
  liora: "border-[var(--liora-rose-deep)]/25 bg-[var(--liora-cream)] text-[var(--liora-ink-soft)]",
};

const ACTIVE: Record<PublicExperienceVariant, string> = {
  default: "text-[var(--color-primary)]",
  mozarthitos: "text-[var(--mz-header-red-deep)]",
  espaciozenit: "text-[var(--ez-cyan)]",
  nago: "text-[var(--nago-gold)]",
  mimundo: "text-[var(--mm-green-dark)]",
  liora: "text-[var(--liora-rose-deep)]",
};

interface Tab {
  id: string;
  href: string;
  label: string;
  icon: typeof Home;
  sessionDot?: boolean;
}

function fourthTab(props: PublicPwaTabBarProps): Tab {
  const { locale, sessionEmail, labels, inscriptionsEnabled = true, merchEnabled = false, blogEnabled = true } =
    props;
  if (inscriptionsEnabled && !sessionEmail) {
    return { id: "enroll", href: `/${locale}/register`, label: labels.enroll, icon: UserPlus };
  }
  if (merchEnabled) {
    return { id: "shop", href: `/${locale}/tienda`, label: labels.shop, icon: ShoppingBag };
  }
  if (blogEnabled) {
    return { id: "blog", href: `/${locale}/blog`, label: labels.blog, icon: Newspaper };
  }
  return { id: "enroll", href: `/${locale}/register`, label: labels.enroll, icon: UserPlus };
}

function isCurrent(pathname: string, tab: Tab, locale: string): boolean {
  if (tab.href.includes("#")) return false;
  if (tab.id === "home") return pathname === `/${locale}` || pathname === `/${locale}/`;
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

export function PublicPwaTabBar(props: PublicPwaTabBarProps) {
  const {
    locale,
    sessionEmail,
    variant = "default",
    coursesHref,
    coursesLabel,
    labels,
    loginLabel,
    portalLabel,
  } = props;
  const pathname = usePathname() ?? `/${locale}`;
  const account: Tab = sessionEmail
    ? {
        id: "portal",
        href: `/${locale}/dashboard`,
        label: portalLabel,
        icon: LayoutDashboard,
        sessionDot: true,
      }
    : { id: "login", href: `/${locale}/login`, label: loginLabel, icon: LogIn };

  const tabs: Tab[] = [
    { id: "home", href: `/${locale}`, label: labels.home, icon: Home },
    { id: "courses", href: coursesHref, label: coursesLabel, icon: BookOpen },
    { id: "events", href: `/${locale}/events`, label: labels.events, icon: CalendarDays },
    fourthTab(props),
    account,
  ];

  return (
    <nav
      aria-label={labels.aria}
      data-variant={variant}
      className={`public-pwa-tab fixed inset-x-0 bottom-0 z-40 border-t md:hidden ${BAR[variant]}`}
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <ul className="mx-auto flex max-w-[var(--layout-max-width)] items-stretch justify-around px-1 pt-1">
        {tabs.map((tab) => {
          const current = isCurrent(pathname, tab, locale);
          const Icon = tab.icon;
          return (
            <li key={tab.id} className="min-w-0 flex-1">
              <Link
                href={tab.href}
                aria-current={current ? "page" : undefined}
                className={`relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-1 py-1 text-[0.625rem] font-semibold leading-tight ${
                  current ? ACTIVE[variant] : "hover:text-[var(--color-foreground)]"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {tab.sessionDot ? (
                  <span
                    className="absolute right-[calc(50%-1.1rem)] top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]"
                    data-session-dot="true"
                    aria-hidden
                  />
                ) : null}
                <span className="max-w-full truncate">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
