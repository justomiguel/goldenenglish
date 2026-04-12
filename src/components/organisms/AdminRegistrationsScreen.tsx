"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminRegistrationsSkeleton } from "@/components/molecules/AdminRegistrationsSkeleton";
import { AdminRegistrationsTableDesktop } from "@/components/desktop/organisms/AdminRegistrationsTableDesktop";
import { AdminRegistrationsScreenNarrow } from "@/components/pwa/organisms/AdminRegistrationsScreenNarrow";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { RegistrationAcceptUserLabels } from "@/components/dashboard/AdminRegistrationAcceptForm";

interface AdminRegistrationsScreenProps {
  locale: string;
  rows: AdminRegistrationRow[];
  legalAgeMajority: number;
  labels: Dictionary["admin"]["registrations"];
  tableLabels: Dictionary["admin"]["table"];
  userLabels: RegistrationAcceptUserLabels;
}

export function AdminRegistrationsScreen({
  locale,
  rows,
  legalAgeMajority,
  labels,
  tableLabels,
  userLabels,
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
        />
      )}
    />
  );
}
