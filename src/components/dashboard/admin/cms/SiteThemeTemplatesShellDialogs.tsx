"use client";

import type { Dictionary } from "@/types/i18n";
import { SiteThemeTemplateNameDialog } from "./SiteThemeTemplateNameDialog";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type { SiteThemeTemplatesShellDialogState } from "./siteThemeTemplatesShellDialogState";
import type { SiteThemeRowConfirmState } from "./siteThemeTemplatesShellRowConfirm";
import type { SiteThemeTemplateNameDialogLabels } from "./SiteThemeTemplateNameDialog";

type Labels = Dictionary["admin"]["cms"]["templates"];

export interface SiteThemeTemplatesShellDialogsProps {
  labels: Labels;
  dialog: SiteThemeTemplatesShellDialogState;
  clearDialog: () => void;
  dialogLabels: SiteThemeTemplateNameDialogLabels;
  initialName: string;
  initialSlug: string;
  pending: boolean;
  onSubmit: (input: { name: string; slug: string; activate?: boolean }) => void;
  rowConfirm: SiteThemeRowConfirmState;
  onRowConfirmOpenChange: (open: boolean) => void;
  onConfirmRowAction: () => void;
}

export function SiteThemeTemplatesShellDialogs({
  labels,
  dialog,
  clearDialog,
  dialogLabels,
  initialName,
  initialSlug,
  pending,
  onSubmit,
  rowConfirm,
  onRowConfirmOpenChange,
  onConfirmRowAction,
}: SiteThemeTemplatesShellDialogsProps) {
  return (
    <>
      <SiteThemeTemplateNameDialog
        open={dialog.kind != null}
        onOpenChange={(open) => {
          if (!open) clearDialog();
        }}
        labels={dialogLabels}
        showActivateToggle={dialog.kind === "create"}
        initialName={initialName}
        initialSlug={initialSlug}
        errorMessage={dialog.errorCode ? labels.errors[dialog.errorCode] : null}
        isSubmitting={pending}
        onSubmit={onSubmit}
      />

      <ConfirmActionModal
        open={rowConfirm !== null}
        onOpenChange={onRowConfirmOpenChange}
        title={rowConfirm?.title ?? ""}
        description={rowConfirm?.description}
        cancelLabel={labels.rowModalCancel}
        confirmLabel={rowConfirm?.confirmLabel ?? ""}
        confirmVariant={rowConfirm?.destructive ? "destructive" : "primary"}
        busy={pending}
        onConfirm={onConfirmRowAction}
      />
    </>
  );
}
