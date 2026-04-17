"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import {
  buildAdminSidebarNavGroups,
  type AdminSidebarNavGroup,
} from "@/components/dashboard/adminSidebarNavGroups";

export interface AdminTeacherNavLabels {
  href: string;
  hint: string;
  cta: string;
  ctaAria: string;
  switchHint: string;
}

export interface AdminSidebarNavContentProps {
  locale: string;
  dict: Dictionary["dashboard"]["adminNav"];
  newRegistrationsCount: number;
  teacherNav?: AdminTeacherNavLabels;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}

function TeacherSwitchCard({
  teacherNav,
  mobile,
  onNavigate,
}: {
  teacherNav: AdminTeacherNavLabels;
  mobile: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div
      className={
        mobile
          ? "rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-3 text-[var(--color-foreground)]"
          : "mb-1 rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 p-3 text-[var(--color-foreground)]"
      }
    >
      <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]">
        {teacherNav.switchHint}
      </p>
      <p className="text-[0.75rem] leading-snug text-[var(--color-muted-foreground)]">
        {teacherNav.hint}
      </p>
      <Link
        href={teacherNav.href}
        onClick={onNavigate}
        aria-label={teacherNav.ctaAria}
        className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/45 bg-[var(--color-background)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] shadow-sm transition hover:bg-[var(--color-muted)]"
      >
        {teacherNav.cta}
      </Link>
    </div>
  );
}

function NavGroupBlock({
  group,
  base,
  profileHref,
  pathname,
  mobile,
  onNavigate,
}: {
  group: AdminSidebarNavGroup;
  base: string;
  profileHref: string;
  pathname: string;
  mobile: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div
      className={
        mobile
          ? "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)]/80 p-2 shadow-sm"
          : undefined
      }
    >
      {group.label && (
        <h3
          className={`mb-1.5 px-3 text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] ${
            mobile ? "pt-1" : ""
          }`}
        >
          {group.label}
        </h3>
      )}
      <div className="space-y-0.5">
        {group.items.map(({ href, label, icon, badge, tip }) => {
          const exact = href === base || href === profileHref;
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={tip}
              className={`flex items-center gap-2.5 rounded-[var(--layout-border-radius)] px-3 text-[0.8125rem] font-medium transition ${
                active
                  ? `border-l-2 border-[var(--color-primary)] text-[var(--color-primary)] ${
                      mobile
                        ? "bg-[var(--color-primary)]/10 py-3 pl-[0.625rem]"
                        : "bg-[var(--color-primary)]/8 py-2 pl-[0.625rem]"
                    }`
                  : `border-l-2 border-transparent text-[var(--color-foreground)]/80 hover:text-[var(--color-foreground)] ${
                      mobile ? "py-3 hover:bg-[var(--color-muted)]/80" : "py-2 hover:bg-[var(--color-muted)]"
                    }`
              }`}
            >
              {icon}
              <span className="flex-1 truncate">{label}</span>
              {badge && badge > 0 ? (
                <span className="rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[0.6rem] font-bold leading-none text-[var(--color-accent-foreground)]">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function AdminSidebarNavContent({
  locale,
  dict,
  newRegistrationsCount,
  teacherNav,
  onNavigate,
  variant = "desktop",
}: AdminSidebarNavContentProps) {
  const pathname = usePathname();
  const base = `/${locale}/dashboard/admin`;
  const profileHref = `/${locale}/dashboard/profile`;
  const groups = buildAdminSidebarNavGroups(base, profileHref, dict, newRegistrationsCount);
  const mobile = variant === "mobile";

  return (
    <nav aria-label={dict.aria} className={mobile ? "space-y-4" : "space-y-5"}>
      {teacherNav ? (
        <TeacherSwitchCard teacherNav={teacherNav} mobile={mobile} onNavigate={onNavigate} />
      ) : null}
      {groups.map((group, gi) => (
        <NavGroupBlock
          key={gi}
          group={group}
          base={base}
          profileHref={profileHref}
          pathname={pathname}
          mobile={mobile}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
