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
import type { RegistrationStatusFilter } from "@/hooks/useAdminRegistrationsList";
import type { RegistrationInboxFilter } from "@/lib/register/registrationInboxFilter";
import type { RegistrationInboxCounts } from "@/lib/register/countRegistrationInboxFilters";
import type { CountryCode } from "libphonenumber-js";

export interface AdminRegistrationsScreenProps {
  locale: string;
  rows: AdminRegistrationRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  sortKey: RegistrationSortKey;
  sortDir: RegistrationSortDir;
  statusFilter?: RegistrationStatusFilter;
  statusCounts: { total: number; new: number; contacted: number };
  inboxFilter?: RegistrationInboxFilter;
  inboxCounts?: RegistrationInboxCounts;
  legalAgeMajority: number;
  instituteName: string;
  /** Default country for phones typed without a prefix; null hides WhatsApp. */
  instituteCountry: CountryCode | null;
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
