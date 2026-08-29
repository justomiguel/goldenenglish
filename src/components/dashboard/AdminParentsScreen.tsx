"use client";

import { useState } from "react";
import { AdminUsersScreen, type AdminUsersScreenProps } from "@/components/organisms/AdminUsersScreen";
import { inviteParentsAction } from "@/app/[locale]/dashboard/admin/parents/actions";
import type { Dictionary } from "@/types/i18n";
import { InfoNoticeModal } from "@/components/molecules/InfoNoticeModal";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";

type ParentsLabels = Dictionary["admin"]["parents"];

export function AdminParentsScreen(
  props: Omit<AdminUsersScreenProps, "parentsDirectory"> & {
    parentsLabels: ParentsLabels;
    scopeParams: Record<string, string>;
  },
) {
  const [outcome, setOutcome] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<string[] | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const { parentsLabels, scopeParams, ...screen } = props;
  const n = pendingIds?.length || screen.totalCount;
  const confirmBody = parentsLabels.inviteConfirmBody
    .replace("{{n}}", String(n))
    .replace("{{e}}", "—")
    .replace("{{p}}", "—");

  return (
    <>
      <AdminUsersScreen
        {...screen}
        lockRole="parent"
        parentsDirectory={{
          labels: parentsLabels,
          onInvite: async (selectedIds) => {
            setPendingIds(selectedIds);
          },
        }}
      />
      <ConfirmActionModal
        open={pendingIds !== null}
        onOpenChange={(o) => {
          if (!o) setPendingIds(null);
        }}
        title={parentsLabels.inviteConfirmTitle}
        body={confirmBody}
        cancelLabel={props.labels.cancel}
        confirmLabel={parentsLabels.inviteConfirm}
        busy={inviteBusy}
        onConfirm={() => {
          const selectedIds = pendingIds ?? [];
          setInviteBusy(true);
          const raw = selectedIds.length
            ? { ids: selectedIds.join(",") }
            : { scope: "filter", ...scopeParams };
          void inviteParentsAction(props.locale, raw).then((res) => {
            setInviteBusy(false);
            setPendingIds(null);
            setOutcome(res.message);
          });
        }}
      />
      <InfoNoticeModal
        open={outcome !== null}
        onOpenChange={(o) => {
          if (!o) setOutcome(null);
        }}
        title={parentsLabels.invite}
        message={outcome ?? ""}
        closeLabel={props.labels.deleteResultClose}
      />
    </>
  );
}
