"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export interface AdminBreadcrumbProps {
  locale: string;
  dict: Dictionary["dashboard"]["adminNav"];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function segmentLabel(
  segment: string,
  dict: AdminBreadcrumbProps["dict"],
): string | null {
  if (UUID_RE.test(segment)) return null;

  const map: Record<string, string> = {
    admin: dict.breadcrumbAdmin,
    analytics: dict.analytics,
    users: dict.users,
    payments: dict.payments,
    finance: dict.breadcrumbFinance,
    receipts: dict.financeReceipts,
    registrations: dict.registrations,
    academic: dict.academics,
    academics: dict.academics,
    requests: dict.transferInboxNav,
    retention: dict.retention,
    messages: dict.messages,
    coupons: dict.coupons,
    promotions: dict.promotions,
    settings: dict.settings,
    new: dict.breadcrumbNew,
    import: dict.breadcrumbImport,
    billing: dict.breadcrumbBilling,
    attendance: dict.breadcrumbAttendance,
    profile: dict.myProfile,
  };

  return map[segment] ?? segment;
}

export function AdminBreadcrumb({ locale, dict }: AdminBreadcrumbProps) {
  const pathname = usePathname();
  const adminBase = `/${locale}/dashboard/admin`;

  if (!pathname.startsWith(adminBase) || pathname === adminBase) return null;

  const relative = pathname.slice(adminBase.length);
  const segments = relative.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: { label: string; href: string }[] = [
    { label: dict.breadcrumbAdmin, href: adminBase },
  ];

  let accumulated = adminBase;
  for (const seg of segments) {
    accumulated += `/${seg}`;
    const label = segmentLabel(seg, dict);
    if (label) {
      crumbs.push({ label, href: accumulated });
    }
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label={dict.breadcrumbNavAria}
      className="mb-4 flex flex-wrap items-center gap-1 text-xs text-[var(--color-muted-foreground)]"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 opacity-50" aria-hidden />}
            {isLast ? (
              <span className="font-medium text-[var(--color-foreground)]" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="rounded-sm transition hover:text-[var(--color-foreground)] hover:underline"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
