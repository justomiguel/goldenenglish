"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminRegistrationsSkeleton } from "@/components/molecules/AdminRegistrationsSkeleton";
import { AdminRegistrationsTableDesktop } from "@/components/desktop/organisms/AdminRegistrationsTableDesktop";
import { AdminRegistrationsScreenNarrow } from "@/components/pwa/organisms/AdminRegistrationsScreenNarrow";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { RegistrationAcceptUserLabels } from "@/components/dashboard/AdminRegistrationAcceptForm";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";

interface AdminRegistrationsScreenProps {
  locale: string;
  rows: AdminRegistrationRow[];
  legalAgeMajority: number;
  labels: Dictionary["admin"]["registrations"];
  tableLabels: Dictionary["admin"]["table"];
  userLabels: RegistrationAcceptUserLabels;
  currentCohortSections?: CurrentCohortSection[];
  currentCohortName?: string;
}

export function AdminRegistrationsScreen({
  locale,
  rows,
  legalAgeMajority,
  labels,
  tableLabels,
  userLabels,
  currentCohortSections,
  currentCohortName,
}: AdminRegistrationsScreenProps) {
  return (
    <SurfaceMountGate
      skeleton={<AdminRegistrationsSkeleton />}
      desktop={
        <AdminRegistrationsTableDesktop
          locale={locale}
          rows={rows}
          legalAgeMajority={legalAgeMajority}
          labels={labels}
          tableLabels={tableLabels}
          userLabels={userLabels}
          currentCohortSections={currentCohortSections}
          currentCohortName={currentCohortName}
        />
      }
      narrow={(surface) => (
        <AdminRegistrationsScreenNarrow
          locale={locale}
          rows={rows}
          legalAgeMajority={legalAgeMajority}
          labels={labels}
          tableLabels={tableLabels}
          userLabels={userLabels}
          surface={surface}
          currentCohortSections={currentCohortSections}
          currentCohortName={currentCohortName}
        />
      )}
    />
  );
}
