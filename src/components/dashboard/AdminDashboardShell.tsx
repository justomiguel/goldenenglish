import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import type { Dictionary } from "@/types/i18n";

interface AdminDashboardShellProps {
  locale: string;
  dict: Dictionary;
  newRegistrationsCount: number;
  children: ReactNode;
}

export function AdminDashboardShell({
  locale,
  dict,
  newRegistrationsCount,
  children,
}: AdminDashboardShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-muted)]">
      <div className="mx-auto flex max-w-[var(--layout-max-width)] gap-0 md:gap-6">
        <AdminSidebar
          locale={locale}
          dict={dict.dashboard.adminNav}
          newRegistrationsCount={newRegistrationsCount}
        />
        <div className="min-w-0 flex-1 px-3 py-6 md:px-6">
          <div className="mb-6 flex justify-end">
            <LanguageSwitcher locale={locale} labels={dict.common.locale} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
