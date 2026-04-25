import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { StudentChromeHeader } from "@/components/dashboard/StudentChromeHeader";
import { StudentSidebar } from "@/components/dashboard/StudentSidebar";
import { StudentMobileDrawer } from "@/components/dashboard/StudentMobileDrawer";
import { StudentBreadcrumb } from "@/components/dashboard/StudentBreadcrumb";

export interface StudentDashboardShellProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  section?: "student" | "parent";
  children: ReactNode;
}

export function StudentDashboardShell({
  locale,
  dict,
  brand,
  section = "student",
  children,
}: StudentDashboardShellProps) {
  const isParent = section === "parent";
  const navDict = isParent ? dict.dashboard.parentNav : dict.dashboard.studentNav;
  const chromeLabels = isParent ? dict.dashboard.parentChrome : dict.dashboard.studentChrome;
  const baseHref = `/${locale}/dashboard/${section}`;
  const profileHref = `/${locale}/dashboard/profile`;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]">
      <StudentChromeHeader
        locale={locale}
        brand={brand}
        dict={dict}
        homeHref={baseHref}
        labels={chromeLabels}
        mobileNav={
          <StudentMobileDrawer
            locale={locale}
            dict={dict}
            navDict={navDict}
            chromeLabels={chromeLabels}
            baseHref={baseHref}
            profileHref={profileHref}
          />
        }
      />
      <div className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 gap-0 md:gap-8 md:px-2 md:pb-8 md:pt-2">
        <StudentSidebar
          locale={locale}
          dict={navDict}
          baseHref={baseHref}
          profileHref={profileHref}
        />
        <div className="min-w-0 flex-1 px-4 py-6 md:rounded-[var(--layout-border-radius)] md:border md:border-[var(--color-border)] md:bg-[var(--color-background)] md:px-8 md:py-8 md:shadow-sm">
          <StudentBreadcrumb locale={locale} dict={navDict} baseHref={baseHref} />
          {children}
        </div>
      </div>
    </div>
  );
}
