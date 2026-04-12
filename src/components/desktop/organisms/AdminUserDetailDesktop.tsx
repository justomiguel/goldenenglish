"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import { AdminUserDetailPanel } from "@/components/dashboard/AdminUserDetailPanel";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserDetailDesktopProps {
  locale: string;
  labels: UserLabels;
  detail: AdminUserDetailVM;
  billingHref?: string;
}

export function AdminUserDetailDesktop({ locale, labels, detail, billingHref }: AdminUserDetailDesktopProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/${locale}/dashboard/admin/users`}
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-secondary)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {labels.detailBack}
      </Link>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailLead}</p>
      {billingHref ? (
        <Link
          href={billingHref}
          className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
        >
          {labels.detailBillingLink}
        </Link>
      ) : null}
      <AdminUserDetailPanel detail={detail} labels={labels} />
    </div>
  );
}
