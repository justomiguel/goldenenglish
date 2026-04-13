"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Gift,
  Home,
  MessageCircle,
  Settings,
  Ticket,
  User,
  Users,
  Wallet,
  ClipboardList,
  CalendarDays,
  Inbox,
  TriangleAlert,
  FileText,
} from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export interface AdminSidebarProps {
  locale: string;
  dict: Dictionary["dashboard"]["adminNav"];
  newRegistrationsCount: number;
}

const iconClass = "h-4 w-4 shrink-0 opacity-90";

export function AdminSidebar({
  locale,
  dict,
  newRegistrationsCount,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const base = `/${locale}/dashboard/admin`;

  const links: { href: string; label: string; icon: ReactNode; badge?: number }[] = [
    {
      href: `/${locale}/dashboard/profile`,
      label: dict.myProfile,
      icon: <User className={iconClass} />,
    },
    { href: base, label: dict.home, icon: <Home className={iconClass} /> },
    {
      href: `${base}/analytics`,
      label: dict.analytics,
      icon: <Activity className={iconClass} />,
    },
    { href: `${base}/users`, label: dict.users, icon: <Users className={iconClass} /> },
    { href: `${base}/payments`, label: dict.payments, icon: <Wallet className={iconClass} /> },
    {
      href: `${base}/finance/receipts`,
      label: dict.financeReceipts,
      icon: <FileText className={iconClass} />,
    },
    {
      href: `${base}/registrations`,
      label: dict.registrations,
      icon: <ClipboardList className={iconClass} />,
      badge: newRegistrationsCount,
    },
    {
      href: `${base}/academic`,
      label: dict.academics,
      icon: <CalendarDays className={iconClass} />,
    },
    {
      href: `${base}/requests`,
      label: dict.transferInboxNav,
      icon: <Inbox className={iconClass} />,
    },
    {
      href: `${base}/retention`,
      label: dict.retention,
      icon: <TriangleAlert className={iconClass} />,
    },
    {
      href: `${base}/messages`,
      label: dict.messages,
      icon: <MessageCircle className={iconClass} />,
    },
    {
      href: `${base}/coupons`,
      label: dict.coupons,
      icon: <Ticket className={iconClass} />,
    },
    {
      href: `${base}/promotions`,
      label: dict.promotions,
      icon: <Gift className={iconClass} />,
    },
    { href: `${base}/settings`, label: dict.settings, icon: <Settings className={iconClass} /> },
  ];

  return (
    <>
      <aside className="hidden w-56 shrink-0 md:block md:rounded-[var(--layout-border-radius)] md:border md:border-[var(--color-border)] md:bg-[var(--color-surface)] md:py-6 md:pl-3 md:pr-2 md:shadow-sm">
        <nav aria-label={dict.aria} className="space-y-1">
          {links.map(({ href, label, icon, badge }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-[var(--layout-border-radius)] px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                }`}
              >
                {icon}
                <span className="flex-1">{label}</span>
                {badge && badge > 0 ? (
                  <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[0.65rem] font-bold text-[var(--color-accent-foreground)]">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 md:hidden">
        <label className="sr-only" htmlFor="admin-nav-m">
          {dict.mobileSelect}
        </label>
        <select
          id="admin-nav-m"
          className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          value={
            links.find((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))?.href ??
            base
          }
          onChange={(e) => {
            window.location.href = e.target.value;
          }}
        >
          {links.map((l) => (
            <option key={l.href} value={l.href}>
              {l.label}
              {l.badge && l.badge > 0 ? ` (${l.badge})` : ""}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
