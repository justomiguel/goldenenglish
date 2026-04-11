"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminUsersSkeleton } from "@/components/molecules/AdminUsersSkeleton";
import { AdminUsersTableDesktop } from "@/components/desktop/organisms/AdminUsersTableDesktop";
import { AdminUsersScreenNarrow } from "@/components/pwa/organisms/AdminUsersScreenNarrow";
import type { Dictionary } from "@/types/i18n";
import type { AdminUserRow } from "@/lib/dashboard/adminUsersTableHelpers";

type UserLabels = Dictionary["admin"]["users"];
type TableLabels = Dictionary["admin"]["table"];

export interface AdminUsersScreenProps {
  rows: AdminUserRow[];
  locale: string;
  currentUserId: string;
  labels: UserLabels;
  tableLabels: TableLabels;
}

export function AdminUsersScreen({
  rows,
  locale,
  currentUserId,
  labels,
  tableLabels,
}: AdminUsersScreenProps) {
  return (
    <SurfaceMountGate
      skeleton={<AdminUsersSkeleton />}
      desktop={
        <AdminUsersTableDesktop
          rows={rows}
          locale={locale}
          currentUserId={currentUserId}
          labels={labels}
          tableLabels={tableLabels}
        />
      }
      narrow={(surface) => (
        <AdminUsersScreenNarrow
          rows={rows}
          locale={locale}
          currentUserId={currentUserId}
          labels={labels}
          tableLabels={tableLabels}
          surface={surface}
        />
      )}
    />
  );
}
