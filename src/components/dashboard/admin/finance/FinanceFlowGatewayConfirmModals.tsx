"use client";

import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type { Dictionary } from "@/types/i18n";

type FlowDict = Dictionary["admin"]["finance"]["settings"];

export interface FinanceFlowGatewayConfirmModalsProps {
  dict: FlowDict;
  replaceOpen: boolean;
  removeOpen: boolean;
  setReplaceOpen: (open: boolean) => void;
  setRemoveOpen: (open: boolean) => void;
  busy: boolean;
  onReplaceConfirm: () => void;
  onRemoveConfirm: () => void;
}

export function FinanceFlowGatewayConfirmModals({
  dict,
  replaceOpen,
  removeOpen,
  setReplaceOpen,
  setRemoveOpen,
  busy,
  onReplaceConfirm,
  onRemoveConfirm,
}: FinanceFlowGatewayConfirmModalsProps) {
  return (
    <>
      <ConfirmActionModal
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        title={dict.flowRotateConfirmTitle}
        description={dict.flowRotateConfirmDescription}
        cancelLabel={dict.flowModalCancel}
        confirmLabel={dict.flowRotateConfirmAction}
        busy={busy}
        onConfirm={onReplaceConfirm}
      />

      <ConfirmActionModal
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={dict.flowRemoveConfirmTitle}
        description={dict.flowRemoveConfirmDescription}
        cancelLabel={dict.flowModalCancel}
        confirmLabel={dict.flowRemoveConfirmAction}
        confirmVariant="destructive"
        busy={busy}
        onConfirm={onRemoveConfirm}
      />
    </>
  );
}
