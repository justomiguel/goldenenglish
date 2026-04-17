"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminRegistrationsSkeleton } from "@/components/molecules/AdminRegistrationsSkeleton";
import { AdminRegistrationsTableDesktop } from "@/components/desktop/organisms/AdminRegistrationsTableDesktop";
import { AdminRegistrationsScreenNarrow } from "@/components/pwa/organisms/AdminRegistrationsScreenNarrow";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { RegistrationAcceptUserLabels } from "@/components/dashboard/AdminRegistrationAcceptForm";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";
import type { RegistrationSortKey, RegistrationSortDir } from "@/lib/dashboard/adminRegistrationsSort";

export interface AdminRegistrationsScreenProps {
  locale: string;
  rows: AdminRegistrationRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  sortKey: RegistrationSortKey;
  sortDir: RegistrationSortDir;
  legalAgeMajority: number;
  labels: Dictionary["admin"]["registrations"];
  tableLabels: Dictionary["admin"]["table"];
  userLabels: RegistrationAcceptUserLabels;
  currentCohortSections?: CurrentCohortSection[];
  currentCohortName?: string;
}

export function AdminRegistrationsScreen(props: AdminRegistrationsScreenProps) {
  return (
    <SurfaceMountGate
      skeleton={<AdminRegistrationsSkeleton />}
      desktop={<AdminRegistrationsTableDesktop {...props} />}
      narrow={(surface) => (
        <AdminRegistrationsScreenNarrow {...props} surface={surface} />
      )}
    />
  );
}
