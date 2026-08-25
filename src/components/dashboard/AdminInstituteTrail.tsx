"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { isAdminInstituteChildPath } from "@/lib/dashboard/adminInstituteChildPaths";

function pageLabel(pathname: string, base: string, dict: Dictionary["dashboard"]["adminNav"]): string {
  const rest = pathname.slice(base.length);
  const map: Array<[string, string]> = [
    ["/academic/contents", dict.contents],
    ["/communications/templates", dict.emailTemplates],
    ["/cms/blog", dict.blog],
    ["/site-setup", dict.siteSetup],
    ["/calendar", dict.calendar],
    ["/events", dict.events],
    ["/badges", dict.badges],
    ["/coupons", dict.coupons],
    ["/promotions", dict.promotions],
    ["/analytics", dict.analytics],
    ["/audit", dict.audit],
    ["/glossary", dict.glossary],
    ["/settings", dict.settings],
    ["/cms", dict.cms],
    ["/users", dict.allAccounts],
  ];
  for (const [suffix, label] of map) {
    if (rest === suffix || rest.startsWith(`${suffix}/`)) return label;
  }
  return dict.institute;
}

export function AdminInstituteTrail({
  locale,
  dict,
}: {
  locale: string;
  dict: Dictionary["dashboard"]["adminNav"];
}) {
  const pathname = usePathname();
  const base = `/${locale}/dashboard/admin`;
  if (!isAdminInstituteChildPath(pathname, base)) return null;

  const label = pageLabel(pathname, base, dict);

  return (
    <nav
      aria-label={dict.breadcrumbNavAria}
      className="mb-4 flex flex-wrap items-center gap-1 text-xs text-[var(--color-muted-foreground)]"
    >
      <Link
        href={`${base}/institute`}
        className="rounded-sm transition hover:text-[var(--color-foreground)] hover:underline"
      >
        {dict.institute}
      </Link>
      <ChevronRight className="h-3 w-3 opacity-50" aria-hidden />
      <span className="font-medium text-[var(--color-foreground)]" aria-current="page">
        {label}
      </span>
    </nav>
  );
}
