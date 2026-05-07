import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { TeacherChromeHeader } from "@/components/dashboard/TeacherChromeHeader";
import { AssistantSidebar } from "@/components/dashboard/AssistantSidebar";
import { AssistantMobileDrawer } from "@/components/dashboard/AssistantMobileDrawer";
import { AssistantBreadcrumb } from "@/components/dashboard/AssistantBreadcrumb";

export interface AssistantDashboardShellProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  children: ReactNode;
}

export function AssistantDashboardShell({ locale, dict, brand, children }: AssistantDashboardShellProps) {
  const navDict = dict.dashboard.assistantNav;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]">
      <TeacherChromeHeader
        locale={locale}
        brand={brand}
        dict={dict}
        dashboardHomeHref={`/${locale}/dashboard/assistant`}
        chromeLabels={dict.dashboard.assistantChrome}
        mobileNav={<AssistantMobileDrawer locale={locale} dict={dict} />}
      />
      <div className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 gap-0 md:gap-8 md:px-2 md:pb-8 md:pt-2">
        <AssistantSidebar locale={locale} dict={navDict} />
        <div className="min-w-0 flex-1 px-4 py-6 md:rounded-[var(--layout-border-radius)] md:border md:border-[var(--color-border)] md:bg-[var(--color-background)] md:px-8 md:py-8 md:shadow-sm">
          <AssistantBreadcrumb locale={locale} dict={navDict} />
          {children}
        </div>
      </div>
    </div>
  );
}
