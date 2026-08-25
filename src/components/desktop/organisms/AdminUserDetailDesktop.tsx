"use client";

import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import type { AdminStudentBillingTabData } from "@/types/adminStudentBilling";
import { AdminBackLink } from "@/components/dashboard/AdminBackLink";
import { AdminUserDetailPanel } from "@/components/dashboard/AdminUserDetailPanel";
import type { StudentCareNotes } from "@/lib/students/care/loadStudentCareNotes";

type UserLabels = Dictionary["admin"]["users"];
type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminUserDetailDesktopProps {
  locale: Locale;
  labels: UserLabels;
  billingLabels: BillingLabels;
  detail: AdminUserDetailVM;
  billing: AdminStudentBillingTabData | null;
  fileUploadProgress: FileUploadProgressLabels;
  care?: StudentCareNotes | null;
}

export function AdminUserDetailDesktop({
  locale,
  labels,
  billingLabels,
  detail,
  billing,
  fileUploadProgress,
  care = null,
}: AdminUserDetailDesktopProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AdminBackLink href={`/${locale}/dashboard/admin/users`} title={labels.tipDetailBack}>
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
  );
}
