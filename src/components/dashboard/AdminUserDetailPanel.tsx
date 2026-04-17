"use client";

import type { Dictionary } from "@/types/i18n";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import { AdminUserProfileFicha } from "@/components/molecules/AdminUserProfileFicha";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserDetailPanelProps {
  locale: string;
  detail: AdminUserDetailVM;
  labels: UserLabels;
}

export function AdminUserDetailPanel({ locale, detail, labels }: AdminUserDetailPanelProps) {
  return <AdminUserProfileFicha locale={locale} labels={labels} detail={detail} />;
}
