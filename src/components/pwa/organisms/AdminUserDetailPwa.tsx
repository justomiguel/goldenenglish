"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import type { AdminStudentBillingTabData } from "@/types/adminStudentBilling";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { AdminUserDetailPanel } from "@/components/dashboard/AdminUserDetailPanel";

type UserLabels = Dictionary["admin"]["users"];
type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminUserDetailPwaProps {
  surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">;
  locale: Locale;
  labels: UserLabels;
  billingLabels: BillingLabels;
  detail: AdminUserDetailVM;
  billing: AdminStudentBillingTabData | null;
}

export function AdminUserDetailPwa({
  surface,
  locale,
  labels,
  billingLabels,
  detail,
  billing,
}: AdminUserDetailPwaProps) {
  return (
    <PwaPageShell surface={surface}>
      <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 py-2">
          <Link
            href={`/${locale}/dashboard/admin/users`}
            title={labels.tipDetailBack}
            className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 text-sm font-medium text-[var(--color-secondary)] active:opacity-80"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden />
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
      </div>
    </PwaPageShell>
  );
}
