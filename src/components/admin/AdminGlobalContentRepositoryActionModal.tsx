"use client";

import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type { Dictionary } from "@/types/i18n";

type RepositoryActionModalState =
  | { kind: "archive"; id: string; title: string }
  | { kind: "delete"; id: string; title: string; routeStepCount: number }
  | null;

interface AdminGlobalContentRepositoryActionModalProps {
  action: RepositoryActionModalState;
  labels: Dictionary["dashboard"]["adminContents"];
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export type { RepositoryActionModalState };

export function AdminGlobalContentRepositoryActionModal({
  action,
  labels,
  busy,
  onOpenChange,
  onConfirm,
}: AdminGlobalContentRepositoryActionModalProps) {
  const isDelete = action?.kind === "delete";
  return (
    <ConfirmActionModal
      open={Boolean(action)}
      onOpenChange={onOpenChange}
      title={isDelete ? labels.deleteConfirmTitle : labels.archiveConfirmTitle}
      description={action ? confirmDescription(action, labels) : undefined}
      body={action ? action.title : undefined}
      cancelLabel={labels.cancel}
      confirmLabel={isDelete ? labels.delete : labels.archive}
      confirmVariant={isDelete ? "destructive" : "primary"}
      busy={busy}
      disableClose={busy}
      onConfirm={onConfirm}
    />
  );
}

function confirmDescription(
  action: Exclude<RepositoryActionModalState, null>,
  labels: Dictionary["dashboard"]["adminContents"],
) {
  if (action.kind === "archive") return labels.archiveConfirm;
  if (action.routeStepCount > 0) {
    return labels.deleteConfirmWithRouteSteps.replace("{count}", String(action.routeStepCount));
  }
  return labels.deleteConfirmNoRouteSteps;
}
