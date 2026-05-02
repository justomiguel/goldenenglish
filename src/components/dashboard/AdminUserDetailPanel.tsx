"use client";

import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import type { AdminStudentBillingTabData } from "@/types/adminStudentBilling";
import { AdminUserProfileFicha } from "@/components/molecules/AdminUserProfileFicha";

type UserLabels = Dictionary["admin"]["users"];
type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminUserDetailPanelProps {
  locale: Locale;
  detail: AdminUserDetailVM;
  labels: UserLabels;
  billingLabels: BillingLabels;
  billing: AdminStudentBillingTabData | null;
  fileUploadProgress: FileUploadProgressLabels;
}

export function AdminUserDetailPanel({
  locale,
  detail,
  labels,
  billingLabels,
  billing,
  fileUploadProgress,
}: AdminUserDetailPanelProps) {
  return (
    <AdminUserProfileFicha
      locale={locale}
      labels={labels}
      billingLabels={billingLabels}
      detail={detail}
      billing={billing}
      fileUploadProgress={fileUploadProgress}
    />
  );
}
