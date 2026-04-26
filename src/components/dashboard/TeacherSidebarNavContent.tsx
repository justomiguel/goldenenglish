"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calendar, CalendarDays, Home, MessageCircle, User } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export interface AdminWorkspaceNavLabels {
  href: string;
  hint: string;
  cta: string;
  ctaAria: string;
  switchHint: string;
}

type NavItem = { href: string; label: string; icon: ReactNode; tip?: string };
type NavGroup = { label: string | null; items: NavItem[] };

const ic = "h-4 w-4 shrink-0 opacity-80";

export interface TeacherSidebarNavContentProps {
  locale: string;
  dict: Dictionary["dashboard"]["teacherNav"];
  adminNav?: AdminWorkspaceNavLabels;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}

function buildGroups(base: string, profileHref: string, dict: TeacherSidebarNavContentProps["dict"]): NavGroup[] {
  return [
    {
      label: dict.navScopeTeaching,
      items: [{ href: base, label: dict.home, icon: <Home className={ic} />, tip: dict.tipHome }],
    },
    {
      label: dict.groupWorkspace,
      items: [
        {
          href: `${base}/sections`,
          label: dict.sections,
          icon: <BookOpen className={ic} />,
          tip: dict.tipSections,
        },
        {
          href: `${base}/calendar`,
          label: dict.calendar,
          icon: <Calendar className={ic} />,
          tip: dict.tipCalendar,
        },
        {
          href: `${base}/academics`,
          label: dict.academics,
          icon: <CalendarDays className={ic} />,
          tip: dict.tipAcademics,
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
      label: dict.groupYou,
      items: [
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

export function TeacherSidebarNavContent({
  locale,
  dict,
  adminNav,
  onNavigate,
  variant = "desktop",
}: TeacherSidebarNavContentProps) {
  const pathname = usePathname();
  const base = `/${locale}/dashboard/teacher`;
  const profileHref = `/${locale}/dashboard/profile`;
  const groups = buildGroups(base, profileHref, dict);
  const mobile = variant === "mobile";

  return (
    <nav aria-label={dict.aria} className={mobile ? "space-y-4" : "space-y-5"}>
      {adminNav ? (
        <div
          className={
            mobile
              ? "rounded-[var(--layout-border-radius)] border border-[var(--color-secondary)]/35 bg-[var(--color-secondary)]/8 p-3 text-[var(--color-foreground)]"
              : "mb-1 rounded-[var(--layout-border-radius)] border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/8 p-3 text-[var(--color-foreground)]"
          }
        >
          <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            {adminNav.switchHint}
          </p>
          <p className="text-[0.75rem] leading-snug text-[var(--color-muted-foreground)]">{adminNav.hint}</p>
          <Link
            href={adminNav.href}
            onClick={onNavigate}
            aria-label={adminNav.ctaAria}
            className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-secondary)]/50 bg-[var(--color-background)] px-3 py-2 text-sm font-semibold text-[var(--color-secondary)] shadow-sm transition hover:bg-[var(--color-muted)]"
          >
            {adminNav.cta}
          </Link>
        </div>
      ) : null}
      {groups.map((group, gi) => (
        <div
          key={gi}
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
            {group.items.map(({ href, label, icon, tip }) => {
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
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
