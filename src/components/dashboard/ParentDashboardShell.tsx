import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { ParentDashboardShellClient } from "@/components/dashboard/ParentDashboardShellClient";

export interface ParentDashboardShellProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  children: ReactNode;
}

export function ParentDashboardShell({ locale, dict, brand, children }: ParentDashboardShellProps) {
  return (
    <ParentDashboardShellClient locale={locale} dict={dict} brand={brand}>
      {children}
    </ParentDashboardShellClient>
  );
}
