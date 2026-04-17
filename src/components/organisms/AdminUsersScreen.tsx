"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminUsersSkeleton } from "@/components/molecules/AdminUsersSkeleton";
import { AdminUsersTableDesktop } from "@/components/desktop/organisms/AdminUsersTableDesktop";
import { AdminUsersScreenNarrow } from "@/components/pwa/organisms/AdminUsersScreenNarrow";
import type { Dictionary } from "@/types/i18n";
import type { AdminUserRow, SortKey, SortDir } from "@/lib/dashboard/adminUsersTableHelpers";

type UserLabels = Dictionary["admin"]["users"];
type TableLabels = Dictionary["admin"]["table"];

export interface AdminUsersScreenProps {
  rows: AdminUserRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  roleFilter: string;
  sortKey: SortKey;
  sortDir: SortDir;
  locale: string;
  currentUserId: string;
  labels: UserLabels;
  tableLabels: TableLabels;
}

export function AdminUsersScreen(props: AdminUsersScreenProps) {
  return (
    <SurfaceMountGate
      skeleton={<AdminUsersSkeleton />}
      desktop={<AdminUsersTableDesktop {...props} />}
      narrow={(surface) => (
        <AdminUsersScreenNarrow {...props} surface={surface} />
      )}
    />
  );
}
