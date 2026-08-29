"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminUsersSkeleton } from "@/components/molecules/AdminUsersSkeleton";
import { AdminUsersTableDesktop } from "@/components/desktop/organisms/AdminUsersTableDesktop";
import { AdminUsersScreenNarrow } from "@/components/pwa/organisms/AdminUsersScreenNarrow";
import type { Dictionary } from "@/types/i18n";
import type { AdminUsersListRoleCounts } from "@/lib/dashboard/loadAdminUsersListRoleCounts";
import type { AdminUserRow, SortKey, SortDir } from "@/lib/dashboard/adminUsersTableHelpers";
import type { AdminDirectoryFilters, AdminDirectoryRole } from "@/lib/dashboard/adminDirectoryFilters";
import type { AdminDirectoryFacets } from "@/lib/dashboard/countAdminDirectoryFacets";

type UserLabels = Dictionary["admin"]["users"];
type TableLabels = Dictionary["admin"]["table"];

export type AdminParentsDirectoryChrome = {
  labels: Dictionary["admin"]["parents"];
  onInvite: (selectedIds: string[]) => Promise<void>;
};

export type AdminDirectoryFiltersChrome = {
  role: AdminDirectoryRole;
  labels: Dictionary["admin"]["directoryFilters"];
  values: AdminDirectoryFilters;
  facets: AdminDirectoryFacets;
  sectionOptions: { id: string; name: string }[];
};

export interface AdminUsersScreenProps {
  rows: AdminUserRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  roleFilter: string;
  roleCounts: AdminUsersListRoleCounts;
  sortKey: SortKey;
  sortDir: SortDir;
  locale: string;
  currentUserId: string;
  labels: UserLabels;
  tableLabels: TableLabels;
  lockRole?: string;
  parentsDirectory?: AdminParentsDirectoryChrome;
  directoryFilters?: AdminDirectoryFiltersChrome;
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
