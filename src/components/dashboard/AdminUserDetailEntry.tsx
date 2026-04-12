"use client";

import type { Dictionary } from "@/types/i18n";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import { useAppSurface } from "@/hooks/useAppSurface";
import { AdminUserDetailDesktop } from "@/components/desktop/organisms/AdminUserDetailDesktop";
import { AdminUserDetailPwa } from "@/components/pwa/organisms/AdminUserDetailPwa";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserDetailEntryProps {
  locale: string;
  labels: UserLabels;
  detail: AdminUserDetailVM;
  billingHref?: string;
}

export function AdminUserDetailEntry({ locale, labels, detail, billingHref }: AdminUserDetailEntryProps) {
  const surface = useAppSurface();

  if (surface === "web-desktop") {
    return (
      <AdminUserDetailDesktop locale={locale} labels={labels} detail={detail} billingHref={billingHref} />
    );
  }

  return (
    <AdminUserDetailPwa
      surface={surface}
      locale={locale}
      labels={labels}
      detail={detail}
      billingHref={billingHref}
    />
  );
}
