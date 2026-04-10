"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Download,
  Home,
  Settings,
  Users,
  Wallet,
  ClipboardList,
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
    { href: base, label: dict.home, icon: <Home className={iconClass} /> },
    { href: `${base}/import`, label: dict.import, icon: <Download className={iconClass} /> },
    { href: `${base}/users`, label: dict.users, icon: <Users className={iconClass} /> },
    { href: `${base}/payments`, label: dict.payments, icon: <Wallet className={iconClass} /> },
    {
      href: `${base}/registrations`,
      label: dict.registrations,
      icon: <ClipboardList className={iconClass} />,
      badge: newRegistrationsCount,
    },
    { href: `${base}/settings`, label: dict.settings, icon: <Settings className={iconClass} /> },
  ];

  return (
    <>
      <aside className="hidden w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] md:block md:min-h-screen md:py-8 md:pl-4">
        <nav aria-label={dict.aria} className="space-y-1 pr-2">
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
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 md:hidden">
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
