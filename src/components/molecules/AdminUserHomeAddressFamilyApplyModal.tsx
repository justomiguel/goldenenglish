"use client";

import { UserRound, UsersRound } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type { Dictionary } from "@/types/i18n";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserHomeAddressFamilyApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peerCount: number;
  labels: UserLabels;
  busy: boolean;
  onApplySingle: () => void;
  onApplyFamily: () => void;
}

function replaceCount(template: string, count: number): string {
  return template.replace(/\{\{count\}\}/g, String(count));
}

export function AdminUserHomeAddressFamilyApplyModal({
  open,
  onOpenChange,
  peerCount,
  labels,
  busy,
  onApplySingle,
  onApplyFamily,
}: AdminUserHomeAddressFamilyApplyModalProps) {
  const totalProfiles = peerCount + 1;
  const body = replaceCount(labels.detailHomeAddressFamilyPromptBody, peerCount);

  return (
    <ConfirmActionModal
      open={open}
      onOpenChange={onOpenChange}
      title={labels.detailHomeAddressFamilyPromptTitle}
      description={labels.detailHomeAddressFamilyPromptLead}
      body={body}
      formSlot={
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            className="gap-2 min-h-[44px]"
            onClick={() => onApplySingle()}
          >
            <UserRound className="h-4 w-4 shrink-0" aria-hidden />
            {labels.detailHomeAddressFamilyApplyOne}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={busy}
            className="gap-2 min-h-[44px]"
            onClick={() => onApplyFamily()}
          >
            <UsersRound className="h-4 w-4 shrink-0" aria-hidden />
            {replaceCount(labels.detailHomeAddressFamilyApplyAll, totalProfiles)}
          </Button>
        </div>
      }
      cancelLabel={labels.detailCancelEdit}
      confirmLabel=""
      confirmHidden
      busy={busy}
      disableClose={busy}
      onConfirm={() => {}}
    />
  );
}
