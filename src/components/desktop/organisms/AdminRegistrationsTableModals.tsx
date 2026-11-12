"use client";

import { AdminRegistrationAcceptModal } from "@/components/dashboard/AdminRegistrationAcceptModal";
import type { RegistrationAcceptUserLabels } from "@/components/dashboard/AdminRegistrationAcceptForm";
import { AdminRegistrationDeleteModal } from "@/components/dashboard/AdminRegistrationDeleteModal";
import { AdminRegistrationEditModal } from "@/components/dashboard/AdminRegistrationEditModal";
import type { useAdminRegistrationsList } from "@/hooks/useAdminRegistrationsList";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";
import type { Dictionary } from "@/types/i18n";

type List = ReturnType<typeof useAdminRegistrationsList>;

export function AdminRegistrationsTableModals({
  locale,
  labels,
  userLabels,
  legalAgeMajority,
  list,
  currentCohortSections,
  currentCohortName,
  createSectionHref,
  usesCefrLevel,
}: {
  locale: string;
  labels: Dictionary["admin"]["registrations"];
  userLabels: RegistrationAcceptUserLabels;
  legalAgeMajority: number;
  list: List;
  currentCohortSections?: CurrentCohortSection[];
  currentCohortName?: string;
  createSectionHref?: string | null;
  usesCefrLevel: boolean;
}) {
  return (
    <>
      <AdminRegistrationDeleteModal
        row={list.deleteRow}
        busy={list.busyId !== null}
        onClose={() => list.setDeleteRow(null)}
        onConfirm={list.onConfirmDelete}
        labels={labels}
      />
      <AdminRegistrationAcceptModal
        locale={locale}
        row={list.acceptRow}
        legalAgeMajority={legalAgeMajority}
        busy={list.busyId !== null}
        onBusy={list.setBusyId}
        onClose={() => list.setAcceptRow(null)}
        onSuccess={() => {
          list.setToast(labels.acceptSuccess);
          list.refreshList();
        }}
        labels={labels}
        userLabels={userLabels}
        currentCohortSections={currentCohortSections}
        currentCohortName={currentCohortName}
        createSectionHref={createSectionHref}
      />
      <AdminRegistrationEditModal
        locale={locale}
        row={list.editRow}
        busy={list.busyId !== null}
        onBusy={list.setBusyId}
        onClose={() => list.setEditRow(null)}
        onSuccess={() => {
          list.setToast(labels.editSuccess);
          list.refreshList();
        }}
        labels={labels}
        usesCefrLevel={usesCefrLevel}
      />
    </>
  );
}
