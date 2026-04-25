"use client";

import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import type { AdminStudentBillingTabData } from "@/types/adminStudentBilling";
import { useAppSurface } from "@/hooks/useAppSurface";
import { AdminUserDetailDesktop } from "@/components/desktop/organisms/AdminUserDetailDesktop";
import { AdminUserDetailPwa } from "@/components/pwa/organisms/AdminUserDetailPwa";

type UserLabels = Dictionary["admin"]["users"];
type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminUserDetailEntryProps {
  locale: Locale;
  labels: UserLabels;
  billingLabels: BillingLabels;
  detail: AdminUserDetailVM;
  billing: AdminStudentBillingTabData | null;
}

export function AdminUserDetailEntry({
  locale,
  labels,
  billingLabels,
  detail,
  billing,
}: AdminUserDetailEntryProps) {
  const surface = useAppSurface();

  if (surface === "web-desktop") {
    return (
      <AdminUserDetailDesktop
        locale={locale}
        labels={labels}
        billingLabels={billingLabels}
        detail={detail}
        billing={billing}
      />
    );
  }

  return (
    <AdminUserDetailPwa
      surface={surface}
      locale={locale}
      labels={labels}
      billingLabels={billingLabels}
      detail={detail}
      billing={billing}
    />
  );
}
