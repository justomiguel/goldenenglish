"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminRegistrationsSkeleton } from "@/components/molecules/AdminRegistrationsSkeleton";
import { AdminRegistrationsTableDesktop } from "@/components/desktop/organisms/AdminRegistrationsTableDesktop";
import { AdminRegistrationsScreenNarrow } from "@/components/pwa/organisms/AdminRegistrationsScreenNarrow";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

interface AdminRegistrationsScreenProps {
  locale: string;
  rows: AdminRegistrationRow[];
  labels: Dictionary["admin"]["registrations"];
  tableLabels: Dictionary["admin"]["table"];
  userLabels: Pick<Dictionary["admin"]["users"], "password" | "passwordHint">;
}

export function AdminRegistrationsScreen({
  locale,
  rows,
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
          labels={labels}
          tableLabels={tableLabels}
          userLabels={userLabels}
        />
      }
      narrow={(surface) => (
        <AdminRegistrationsScreenNarrow
          locale={locale}
          rows={rows}
          labels={labels}
          tableLabels={tableLabels}
          userLabels={userLabels}
          surface={surface}
        />
      )}
    />
  );
}
