"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import {
  buildAdminSidebarNavGroups,
  type AdminSidebarNavGroup,
} from "@/components/dashboard/adminSidebarNavGroups";
import { isAdminSidebarNavItemActive } from "@/lib/dashboard/adminSidebarNavActive";
import { useAdminPersonRecordRole } from "@/hooks/useAdminPersonRecordRole";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { adminSurfaceIcon } from "@/lib/dashboard/adminSurfaceIcon";

void ADMIN_TOUR_ANCHORS.navUsers;
void ADMIN_TOUR_ANCHORS.navAcademic;
void ADMIN_TOUR_ANCHORS.navInstitute;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface AdminSidebarNavContentProps {
  locale: string;
  dict: Dictionary["dashboard"]["adminNav"];
  newRegistrationsCount: number;
  recentInboundMessagesCount: number;
  /** When true, includes Communications → Email templates (mega-admin only). */
  includeEmailTemplatesNav?: boolean;
  /** When true, includes Blog under CMS tools (tenant `blog_enabled`). */
  includeBlogNav?: boolean;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
  tone?: "light" | "dark";
}

function financeHrefForPathname(base: string, pathname: string): string {
  const defaultHref = `${base}/finance`;
  const academicPrefix = `${base}/academic/`;
  if (!pathname.startsWith(academicPrefix)) return defaultHref;

  const cohortId = pathname.slice(academicPrefix.length).split("/")[0] ?? "";
  if (!UUID_RE.test(cohortId)) return defaultHref;

  const params = new URLSearchParams({
    tab: "collections",
    cohort: cohortId,
  });
  return `${defaultHref}?${params.toString()}`;
}

function NavGroupBlock({
  group,
  base,
  profileHref,
  pathname,
  allHrefs,
  mobile,
  tone,
  personRecordRole,
  onNavigate,
}: {
  group: AdminSidebarNavGroup;
  base: string;
  profileHref: string;
  pathname: string;
  allHrefs: readonly string[];
  mobile: boolean;
  tone: "light" | "dark";
  personRecordRole: string | null;
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
      <div className="space-y-0.5">
        {group.items.map(({ href, label, iconId, badge, tip, tourId }) => {
          const active = isAdminSidebarNavItemActive(
            pathname,
            href,
            base,
            profileHref,
            allHrefs,
            { personRecordRole },
          );
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={tip}
              {...(tourId ? { "data-tour": tourId } : {})}
              className={`flex items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition ${
                tone === "dark"
                  ? active
                    ? `bg-white/15 text-white ${mobile ? "py-3" : "py-2.5"}`
                    : `text-white/70 hover:bg-white/8 hover:text-white ${mobile ? "py-3" : "py-2.5"}`
                  : active
                    ? `bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-[var(--color-primary)] ${
                        mobile ? "py-3" : "py-2.5"
                      }`
                    : `text-[var(--color-foreground)]/80 hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] ${
                        mobile ? "py-3" : "py-2.5"
                      }`
              }`}
            >
              {active ? (
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    tone === "dark" ? "bg-white/15" : "bg-white shadow-sm"
                  }`}
                >
                  {adminSurfaceIcon(iconId, "h-6 w-6")}
                </span>
              ) : (
                adminSurfaceIcon(iconId, "h-6 w-6")
              )}
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
  recentInboundMessagesCount,
  includeEmailTemplatesNav = false,
  includeBlogNav = false,
  onNavigate,
  variant = "desktop",
  tone = "light",
}: AdminSidebarNavContentProps) {
  const pathname = usePathname();
  const base = `/${locale}/dashboard/admin`;
  const profileHref = `/${locale}/dashboard/profile`;
  const personRecordRole = useAdminPersonRecordRole(pathname, base);
  const groups = buildAdminSidebarNavGroups(base, profileHref, dict, {
    newRegistrations: newRegistrationsCount,
    recentInboundMessages: recentInboundMessagesCount,
  }, {
    financeHref: financeHrefForPathname(base, pathname),
    includeEmailTemplatesNav,
    includeBlogNav,
  });
  const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));
  const mobile = variant === "mobile";

  return (
    <nav aria-label={dict.aria} className={mobile ? "space-y-4" : "space-y-5"}>
      {groups.map((group, gi) => (
        <NavGroupBlock
          key={gi}
          group={group}
          base={base}
          profileHref={profileHref}
          pathname={pathname}
          allHrefs={allHrefs}
          mobile={mobile}
          tone={tone}
          personRecordRole={personRecordRole}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
