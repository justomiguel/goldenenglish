import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { ParentDashboardShellClient } from "@/components/dashboard/ParentDashboardShellClient";

export interface ParentDashboardShellProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  children: ReactNode;
  baseHref?: string;
  includePayments?: boolean;
  /** Override chrome labels; defaults to parent chrome. */
  chromeLabels?: Dictionary["dashboard"]["parentChrome"];
  /** Override nav dict; defaults to parent nav. */
  navDict?: Dictionary["dashboard"]["parentNav"];
}

export function ParentDashboardShell({
  locale,
  dict,
  brand,
  children,
  baseHref,
  includePayments,
  chromeLabels,
  navDict,
}: ParentDashboardShellProps) {
  return (
    <ParentDashboardShellClient
      locale={locale}
      dict={dict}
      brand={brand}
      baseHref={baseHref}
      includePayments={includePayments}
      chromeLabels={chromeLabels}
      navDict={navDict}
    >
      {children}
    </ParentDashboardShellClient>
  );
}
