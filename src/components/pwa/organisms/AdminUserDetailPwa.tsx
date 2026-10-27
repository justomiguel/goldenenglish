"use client";

import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import type { AdminStudentBillingTabData } from "@/types/adminStudentBilling";
import { AdminBackLink } from "@/components/dashboard/AdminBackLink";
import { adminPersonRecordListHref } from "@/lib/dashboard/adminPersonRecordListHref";
import { AdminUserDetailPanel } from "@/components/dashboard/AdminUserDetailPanel";
import type { StudentCareNotes } from "@/lib/students/care/loadStudentCareNotes";
import type { AcademicProfileCardField } from "@/lib/academic-profile/academicProfileCard";

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
  academicFields?: AcademicProfileCardField[];
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
  academicFields = [],
}: AdminUserDetailPwaProps) {
  void surface;
  return (
    <div className="mx-auto max-w-[var(--layout-max-width)] space-y-3">
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
            academicFields={academicFields}
          />
    </div>
  );
}
