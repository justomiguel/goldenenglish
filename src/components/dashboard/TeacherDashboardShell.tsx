import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { TeacherChromeHeader } from "@/components/dashboard/TeacherChromeHeader";
import { TeacherSidebar } from "@/components/dashboard/TeacherSidebar";
import { TeacherMobileDrawer } from "@/components/dashboard/TeacherMobileDrawer";
import { TeacherBreadcrumb } from "@/components/dashboard/TeacherBreadcrumb";
import type { AdminWorkspaceNavLabels } from "@/components/dashboard/TeacherSidebarNavContent";

export interface TeacherDashboardShellProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  adminNav?: AdminWorkspaceNavLabels;
  children: ReactNode;
}

export function TeacherDashboardShell({ locale, dict, brand, adminNav, children }: TeacherDashboardShellProps) {
  const navDict = dict.dashboard.teacherNav;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]">
      <TeacherChromeHeader
        locale={locale}
        brand={brand}
        dict={dict}
        showAdminWorkspace={Boolean(adminNav)}
        mobileNav={<TeacherMobileDrawer locale={locale} dict={dict} adminNav={adminNav} />}
      />
      <div className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 gap-0 md:gap-8 md:px-2 md:pb-8 md:pt-2">
        <TeacherSidebar locale={locale} dict={navDict} adminNav={adminNav} />
        <div className="min-w-0 flex-1 px-4 py-6 md:rounded-[var(--layout-border-radius)] md:border md:border-[var(--color-border)] md:bg-[var(--color-background)] md:px-8 md:py-8 md:shadow-sm">
          <TeacherBreadcrumb locale={locale} dict={navDict} />
          {children}
        </div>
      </div>
    </div>
  );
}
