"use client";

import type { Dictionary } from "@/types/i18n";
import { WorkplaceNavList } from "@/components/dashboard/WorkplaceNavList";
import type { WorkplaceNavGroup } from "@/lib/dashboard/workplaceNav";

export interface AdminWorkspaceNavLabels {
  href: string;
  hint: string;
  cta: string;
  ctaAria: string;
  switchHint: string;
}

export interface TeacherSidebarNavContentProps {
  locale: string;
  dict: Dictionary["dashboard"]["teacherNav"];
  adminNav?: AdminWorkspaceNavLabels;
  includeBlogNav?: boolean;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
  tone?: "light" | "dark";
}

function buildGroups(
  base: string,
  profileHref: string,
  dict: TeacherSidebarNavContentProps["dict"],
  locale: string,
  includeBlogNav: boolean,
): WorkplaceNavGroup[] {
  return [
    {
      label: dict.navScopeTeaching,
      items: [{ href: base, label: dict.home, iconId: "home", tip: dict.tipHome, exact: true }],
    },
    {
      label: dict.groupWorkspace,
      items: [
        {
          href: `${base}/sections`,
          label: dict.sections,
          iconId: "academic",
          tip: dict.tipSections,
        },
        {
          href: `${base}/calendar`,
          label: dict.calendar,
          iconId: "calendar",
          tip: dict.tipCalendar,
        },
        {
          href: `${base}/academics`,
          label: dict.academics,
          iconId: "academic",
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
          iconId: "messages",
          tip: dict.tipMessages,
        },
        ...(includeBlogNav
          ? [
              {
                href: `/${locale}/dashboard/admin/cms/blog`,
                label: dict.blog,
                iconId: "blog" as const,
                tip: dict.tipBlog,
              },
            ]
          : []),
      ],
    },
    {
      label: dict.groupYou,
      items: [
        {
          href: profileHref,
          label: dict.myProfile,
          iconId: "settings",
          tip: dict.tipMyProfile,
          exact: true,
        },
      ],
    },
  ];
}

export function TeacherSidebarNavContent({
  locale,
  dict,
  includeBlogNav = false,
  onNavigate,
  variant = "desktop",
}: TeacherSidebarNavContentProps) {
  const base = `/${locale}/dashboard/teacher`;
  const profileHref = `/${locale}/dashboard/profile`;
  const groups = buildGroups(base, profileHref, dict, locale, includeBlogNav);

  return (
    <WorkplaceNavList
      groups={groups}
      ariaLabel={dict.aria}
      onNavigate={onNavigate}
      variant={variant}
    />
  );
}
