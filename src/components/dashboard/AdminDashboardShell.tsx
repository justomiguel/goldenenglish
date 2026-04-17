import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { AdminChromeHeader } from "@/components/dashboard/AdminChromeHeader";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminMobileDrawer } from "@/components/dashboard/AdminMobileDrawer";
import { AdminBreadcrumb } from "@/components/dashboard/AdminBreadcrumb";

interface AdminDashboardShellProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  newRegistrationsCount: number;
  adminProfileRole: string;
  teacherPortalAllowed: boolean;
  children: ReactNode;
}

export function AdminDashboardShell({
  locale,
  dict,
  brand,
  newRegistrationsCount,
  adminProfileRole,
  teacherPortalAllowed,
  children,
}: AdminDashboardShellProps) {
  const navDict = dict.dashboard.adminNav;
  const teacherNav = teacherPortalAllowed
    ? {
        href: `/${locale}/dashboard/teacher`,
        hint: dict.dashboard.adminChrome.dualRoleNavHint,
        cta: dict.dashboard.adminChrome.openTeacherDashboard,
        ctaAria: dict.dashboard.adminChrome.openTeacherDashboardAria,
        switchHint: navDict.workspaceSwitchHint,
      }
    : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]">
      <AdminChromeHeader
        locale={locale}
        brand={brand}
        dict={dict}
        adminProfileRole={adminProfileRole}
        teacherPortalAllowed={teacherPortalAllowed}
        mobileNav={
          <AdminMobileDrawer
            locale={locale}
            dict={dict}
            newRegistrationsCount={newRegistrationsCount}
            teacherNav={teacherNav}
          />
        }
      />
      <div className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 gap-0 md:gap-8 md:px-2 md:pb-8 md:pt-2">
        <AdminSidebar
          locale={locale}
          dict={navDict}
          newRegistrationsCount={newRegistrationsCount}
          teacherNav={teacherNav}
        />
        <div className="min-w-0 flex-1 px-4 py-6 md:rounded-[var(--layout-border-radius)] md:border md:border-[var(--color-border)] md:bg-[var(--color-background)] md:px-8 md:py-8 md:shadow-sm">
          <AdminBreadcrumb locale={locale} dict={navDict} />
          {children}
        </div>
      </div>
    </div>
  );
}
