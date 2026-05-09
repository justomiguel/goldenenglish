"use client";

import { useId, useState } from "react";
import { Check, X } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";
import type { SectionCellBulkAction } from "./SectionCollectionsCellActionBar";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

export interface SectionCollectionsCellActionModalProps {
  open: boolean;
  action: SectionCellBulkAction | null;
  cellCount: number;
  onClose: () => void;
  onConfirm: (params: {
    action: SectionCellBulkAction;
    scholarshipPercent?: number;
    note?: string;
  }) => void;
  busy: boolean;
  dict: CollectionsDict;
}

export function SectionCollectionsCellActionModal({
  open,
  action,
  cellCount,
  onClose,
  onConfirm,
  busy,
  dict,
}: SectionCollectionsCellActionModalProps) {
  const titleId = useId();
  const [scholarshipPercent, setScholarshipPercent] = useState("");
  const [note, setNote] = useState("");

  const d = dict.cellActions;

  const title =
    action === "paid"
      ? d.confirmPaidTitle.replace("{count}", String(cellCount))
      : action === "scholarship"
        ? d.confirmScholarshipTitle.replace("{count}", String(cellCount))
        : action === "exempt"
          ? d.confirmExemptTitle.replace("{count}", String(cellCount))
          : "";

  const body =
    action === "paid"
      ? d.confirmPaidBody
      : action === "scholarship"
        ? d.confirmScholarshipBody
        : action === "exempt"
          ? d.confirmExemptBody
          : "";

  const scholarshipPctNum = Number(scholarshipPercent);
  const scholarshipValid =
    Number.isFinite(scholarshipPctNum) &&
    scholarshipPctNum >= 1 &&
    scholarshipPctNum <= 100;
  const exemptValid = note.trim().length > 0;

  const canConfirm =
    action === "paid"
      ? true
      : action === "scholarship"
        ? scholarshipValid
        : action === "exempt"
          ? exemptValid
          : false;

  function handleConfirm() {
    if (!action || !canConfirm) return;
    onConfirm({
      action,
      scholarshipPercent: action === "scholarship" ? scholarshipPctNum : undefined,
      note: note.trim() || undefined,
    });
  }

  function handleClose() {
    setScholarshipPercent("");
    setNote("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
      titleId={titleId}
      title={title}
      disableClose={busy}
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{body}</p>

        {action === "scholarship" ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="scholarship-percent">{d.scholarshipPercentLabel}</Label>
              <Input
                id="scholarship-percent"
                type="number"
                min={1}
                max={100}
                value={scholarshipPercent}
                onChange={(e) => setScholarshipPercent(e.target.value)}
                placeholder={d.scholarshipPercentPlaceholder}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="scholarship-note">{d.scholarshipNoteLabel}</Label>
              <Input
                id="scholarship-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={d.scholarshipNotePlaceholder}
              />
            </div>
          </div>
        ) : null}

        {action === "exempt" ? (
          <div className="space-y-1">
            <Label htmlFor="exempt-reason">{d.exemptReasonLabel}</Label>
            <Input
              id="exempt-reason"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={d.exemptReasonPlaceholder}
            />
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={busy}>
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {d.cancel}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={!canConfirm || busy}
            isLoading={busy}
          >
            <Check className="h-4 w-4 shrink-0" aria-hidden />
            {d.confirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
