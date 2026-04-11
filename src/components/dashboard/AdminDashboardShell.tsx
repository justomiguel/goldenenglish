import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { AdminChromeHeader } from "@/components/dashboard/AdminChromeHeader";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";

interface AdminDashboardShellProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  newRegistrationsCount: number;
  children: ReactNode;
}

export function AdminDashboardShell({
  locale,
  dict,
  brand,
  newRegistrationsCount,
  children,
}: AdminDashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]">
      <AdminChromeHeader locale={locale} brand={brand} dict={dict} />
      <div className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 gap-0 md:gap-8 md:px-2 md:pb-8 md:pt-2">
        <AdminSidebar
          locale={locale}
          dict={dict.dashboard.adminNav}
          newRegistrationsCount={newRegistrationsCount}
        />
        <div className="min-w-0 flex-1 px-4 py-6 md:rounded-[var(--layout-border-radius)] md:border md:border-[var(--color-border)] md:bg-[var(--color-background)] md:px-8 md:py-8 md:shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
