"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteAdminPortalMessage } from "@/app/[locale]/dashboard/admin/messages/actions";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type { Dictionary } from "@/types/i18n";

interface DeletePortalMessageButtonProps {
  locale: string;
  messageId: string;
  labels: Dictionary["admin"]["messages"];
  confirmSnippet?: string;
  navigateAfterDelete: "messages-list" | "refresh";
  messagesListHref?: string;
}

export function DeletePortalMessageButton({
  locale,
  messageId,
  labels,
  confirmSnippet,
  navigateAfterDelete,
  messagesListHref,
}: DeletePortalMessageButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  async function onConfirm() {
    setBusy(true);
    setModalError(null);
    const res = await deleteAdminPortalMessage(locale, messageId);
    setBusy(false);
    if (!res.ok) {
      const msg =
        res.code === "not_found" ? labels.deletePortalMessageNotFound : labels.deletePortalMessageError;
      setModalError(msg);
      return;
    }
    setOpen(false);
    if (navigateAfterDelete === "messages-list" && messagesListHref) {
      router.replace(messagesListHref);
      router.refresh();
      return;
    }
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="min-h-[44px] border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-muted)]"
        title={labels.deletePortalMessageTitle}
        onClick={() => {
          setModalError(null);
          setOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
        {labels.deletePortalMessageAction}
      </Button>
      <ConfirmActionModal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setModalError(null);
        }}
        title={labels.deletePortalMessageConfirmTitle}
        description={labels.deletePortalMessageConfirmDescription}
        body={confirmSnippet}
        formSlot={
          modalError ? (
            <p className="text-sm font-medium text-[var(--color-error)]" role="alert">
              {modalError}
            </p>
          ) : null
        }
        cancelLabel={labels.deletePortalMessageCancel}
        confirmLabel={labels.deletePortalMessageConfirm}
        confirmVariant="destructive"
        busy={busy}
        disableClose={busy}
        onConfirm={onConfirm}
      />
    </>
  );
}
