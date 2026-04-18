"use client";

import { useId, useState } from "react";
import { Modal } from "@/components/atoms/Modal";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import type { Dictionary } from "@/types/i18n";
import { sendBulkCollectionsMessageAction } from "@/app/[locale]/dashboard/admin/finance/collections/actions";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

export interface SectionCollectionsBulkMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  sectionId: string;
  recipientIds: string[];
  dict: CollectionsDict;
  onSent?: (info: { sent: number; skipped: number; failed: number }) => void;
}

interface FeedbackState {
  variant: "success" | "warn" | "error";
  message: string;
}

export function SectionCollectionsBulkMessageModal({
  open,
  onOpenChange,
  locale,
  sectionId,
  recipientIds,
  dict,
  onSent,
}: SectionCollectionsBulkMessageModalProps) {
  const titleId = useId();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  function close() {
    if (busy) return;
    setBody("");
    setFeedback(null);
    onOpenChange(false);
  }

  async function handleSend() {
    if (recipientIds.length === 0) {
      setFeedback({ variant: "warn", message: dict.bulk.messageNoneSelected });
      return;
    }
    if (!body.replace(/<[^>]+>/g, "").trim()) {
      setFeedback({ variant: "warn", message: dict.bulk.messageEmpty });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const res = await sendBulkCollectionsMessageAction({
        locale,
        sectionId,
        recipientIds,
        bodyHtml: body,
      });
      if (!res.ok) {
        setFeedback({ variant: "error", message: res.message });
        return;
      }
      const parts: string[] = [
        dict.bulk.messageSent.replace("{count}", String(res.sent)),
      ];
      if (res.skipped.length > 0) {
        parts.push(
          dict.bulk.messageSkipped.replace(
            "{count}",
            String(res.skipped.length),
          ),
        );
      }
      if (res.failed.length > 0) {
        parts.push(
          dict.bulk.messageFailed.replace(
            "{count}",
            String(res.failed.length),
          ),
        );
      }
      setFeedback({
        variant: res.failed.length > 0 ? "warn" : "success",
        message: parts.join(" "),
      });
      onSent?.({
        sent: res.sent,
        skipped: res.skipped.length,
        failed: res.failed.length,
      });
    } catch {
      setFeedback({ variant: "error", message: dict.bulk.messageError });
    } finally {
      setBusy(false);
    }
  }

  const feedbackClass =
    feedback?.variant === "success"
      ? "text-[var(--color-success)]"
      : feedback?.variant === "warn"
        ? "text-[var(--color-warning)]"
        : "text-[var(--color-error)]";

  return (
    <Modal
      open={open}
      onOpenChange={close}
      titleId={titleId}
      title={dict.bulk.messageTitle}
      disableClose={busy}
      dialogClassName="max-w-xl"
    >
      <p className="text-xs text-[var(--color-muted-foreground)]">
        {dict.bulk.messageHint}
      </p>
      <p className="text-xs font-medium text-[var(--color-foreground)]">
        {dict.matrix.selectionCount.replace(
          "{count}",
          String(recipientIds.length),
        )}
      </p>
      <RichTextEditor
        value={body}
        onChange={setBody}
        disabled={busy}
        aria-label={dict.bulk.messageBodyAria}
      />
      {feedback ? (
        <p role="status" className={`text-xs ${feedbackClass}`}>
          {feedback.message}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={close}
          disabled={busy}
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]/40 disabled:opacity-60"
        >
          {dict.bulk.messageCancel}
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={busy}
          className="rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition hover:bg-[var(--color-primary)]/90 disabled:opacity-60"
        >
          {dict.bulk.messageSend}
        </button>
      </div>
    </Modal>
  );
}
