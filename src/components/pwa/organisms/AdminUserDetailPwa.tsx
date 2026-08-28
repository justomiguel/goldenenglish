"use client";

import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import type { AdminStudentBillingTabData } from "@/types/adminStudentBilling";
import { AdminBackLink } from "@/components/dashboard/AdminBackLink";
import { adminPersonRecordListHref } from "@/lib/dashboard/adminPersonRecordListHref";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { AdminUserDetailPanel } from "@/components/dashboard/AdminUserDetailPanel";
import type { StudentCareNotes } from "@/lib/students/care/loadStudentCareNotes";

type UserLabels = Dictionary["admin"]["users"];
type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminUserDetailPwaProps {
  surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">;
  locale: Locale;
  labels: UserLabels;
  billingLabels: BillingLabels;
  detail: AdminUserDetailVM;
  billing: AdminStudentBillingTabData | null;
  fileUploadProgress: FileUploadProgressLabels;
  care?: StudentCareNotes | null;
}

export function AdminUserDetailPwa({
  surface,
  locale,
  labels,
  billingLabels,
  detail,
  billing,
  fileUploadProgress,
  care = null,
}: AdminUserDetailPwaProps) {
  return (
    <PwaPageShell surface={surface}>
      <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 py-2">
          <AdminBackLink
            href={adminPersonRecordListHref(locale, detail.role)}
            title={labels.tipDetailBack}
          >
            {labels.detailBack}
          </AdminBackLink>
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailLead}</p>
          <AdminUserDetailPanel
            locale={locale}
            detail={detail}
            labels={labels}
            billingLabels={billingLabels}
            billing={billing}
            fileUploadProgress={fileUploadProgress}
            care={care}
          />
        </div>
      </div>
    </PwaPageShell>
  );
}
