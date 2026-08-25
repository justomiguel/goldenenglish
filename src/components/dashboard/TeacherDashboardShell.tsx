import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { TeacherChromeHeader } from "@/components/dashboard/TeacherChromeHeader";
import { TeacherSidebar } from "@/components/dashboard/TeacherSidebar";
import { TeacherMobileDrawer } from "@/components/dashboard/TeacherMobileDrawer";
import { TeacherBreadcrumb } from "@/components/dashboard/TeacherBreadcrumb";
import type { AdminWorkspaceNavLabels } from "@/components/dashboard/TeacherSidebarNavContent";
import type { ViewAsSubject } from "@/lib/dashboard/viewAsTypes";
import { ViewAsBanner } from "@/components/dashboard/ViewAsBanner";

export interface TeacherDashboardShellProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  adminNav?: AdminWorkspaceNavLabels;
  includeBlogNav?: boolean;
  profileDisplayName?: string;
  profileRoleLabel?: string;
  profileAvatarUrl?: string | null;
  viewAs?: ViewAsSubject | null;
  children: ReactNode;
}

export function TeacherDashboardShell({
  locale,
  dict,
  brand,
  adminNav,
  includeBlogNav = false,
  profileDisplayName = "",
  profileRoleLabel = "",
  profileAvatarUrl = null,
  viewAs = null,
  children,
}: TeacherDashboardShellProps) {
  const navDict = dict.dashboard.teacherNav;

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-[var(--color-muted)]">
      <TeacherSidebar
        locale={locale}
        dict={navDict}
        fullDict={dict}
        brand={brand}
        adminNav={adminNav}
        includeBlogNav={includeBlogNav && !viewAs}
        profileDisplayName={profileDisplayName}
        profileRoleLabel={profileRoleLabel}
        profileAvatarUrl={profileAvatarUrl}
        hideSignOut={Boolean(viewAs)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TeacherChromeHeader
          locale={locale}
          brand={brand}
          dict={dict}
          compactBrand
          showAdminWorkspace={Boolean(adminNav) || Boolean(viewAs)}
          viewAs={viewAs}
          mobileNav={
            <TeacherMobileDrawer
              locale={locale}
              dict={dict}
              brand={brand}
              adminNav={adminNav}
              includeBlogNav={includeBlogNav && !viewAs}
              profileDisplayName={profileDisplayName}
              profileRoleLabel={profileRoleLabel}
              profileAvatarUrl={profileAvatarUrl}
              hideSignOut={Boolean(viewAs)}
            />
          }
        />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          {viewAs ? (
            <div className="mb-4">
              <ViewAsBanner locale={locale} dict={dict} viewAs={viewAs} />
            </div>
          ) : null}
          <TeacherBreadcrumb locale={locale} dict={navDict} />
          {children}
        </div>
      </div>
    </div>
  );
}
