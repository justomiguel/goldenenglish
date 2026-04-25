"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import type { AdminStudentBillingTabData } from "@/types/adminStudentBilling";
import { AdminUserDetailPanel } from "@/components/dashboard/AdminUserDetailPanel";

type UserLabels = Dictionary["admin"]["users"];
type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminUserDetailDesktopProps {
  locale: Locale;
  labels: UserLabels;
  billingLabels: BillingLabels;
  detail: AdminUserDetailVM;
  billing: AdminStudentBillingTabData | null;
}

export function AdminUserDetailDesktop({
  locale,
  labels,
  billingLabels,
  detail,
  billing,
}: AdminUserDetailDesktopProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/${locale}/dashboard/admin/users`}
        title={labels.tipDetailBack}
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-secondary)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {labels.detailBack}
      </Link>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailLead}</p>
      <AdminUserDetailPanel
        locale={locale}
        detail={detail}
        labels={labels}
        billingLabels={billingLabels}
        billing={billing}
      />
    </div>
  );
}
