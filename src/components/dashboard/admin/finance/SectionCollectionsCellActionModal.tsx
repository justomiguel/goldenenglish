"use client";

import { useId, useState } from "react";
import { Check, Undo2, X } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { ScholarshipDiscountFields } from "@/components/molecules/ScholarshipDiscountFields";
import type { Dictionary, Locale } from "@/types/i18n";
import type { SectionCellBulkAction } from "./SectionCollectionsCellActionBar";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];
type BillingLabels = Dictionary["admin"]["billing"];

export interface SectionCollectionsCellActionModalProps {
  open: boolean;
  action: SectionCellBulkAction | null;
  cellCount: number;
  /** True when selection includes matrícula column (month 0). */
  includesEnrollmentFee?: boolean;
  onClose: () => void;
  onConfirm: (params: {
    action: SectionCellBulkAction;
    scholarshipPercent?: number;
    note?: string;
  }) => void;
  busy: boolean;
  dict: CollectionsDict;
  billingLabels: BillingLabels;
  locale: Locale;
  referenceMonthlyAmount: number | null;
  referenceMonthlyCurrency: string | null;
}

export function SectionCollectionsCellActionModal({
  open,
  action,
  cellCount,
  includesEnrollmentFee = false,
  onClose,
  onConfirm,
  busy,
  dict,
  billingLabels,
  locale,
  referenceMonthlyAmount,
  referenceMonthlyCurrency,
}: SectionCollectionsCellActionModalProps) {
  const titleId = useId();
  const [resolvedPercent, setResolvedPercent] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const d = dict.cellActions;

  const title =
    action === "paid"
      ? d.confirmPaidTitle.replace("{count}", String(cellCount))
      : action === "scholarship"
        ? d.confirmScholarshipTitle.replace("{count}", String(cellCount))
        : action === "exempt"
          ? d.confirmExemptTitle.replace("{count}", String(cellCount))
          : action === "revert"
            ? d.confirmRevertTitle.replace("{count}", String(cellCount))
            : "";

  const body =
    action === "paid"
      ? d.confirmPaidBody
      : action === "scholarship"
        ? d.confirmScholarshipBody
        : action === "exempt"
          ? d.confirmExemptBody
          : action === "revert"
            ? d.confirmRevertBody
            : "";

  const scholarshipValid =
    resolvedPercent != null && resolvedPercent >= 1 && resolvedPercent <= 100;
  const exemptValid = note.trim().length > 0;

  const canConfirm =
    action === "paid"
      ? true
      : action === "scholarship"
        ? scholarshipValid
        : action === "exempt"
          ? exemptValid
          : action === "revert"
            ? true
            : false;

  function handleConfirm() {
    if (!action || !canConfirm) return;
    onConfirm({
      action,
      scholarshipPercent:
        action === "scholarship" && resolvedPercent != null ? resolvedPercent : undefined,
      note: note.trim() || undefined,
    });
  }

  function handleClose() {
    setResolvedPercent(null);
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
        {includesEnrollmentFee && action === "paid" ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{d.includesEnrollmentFeePaidNote}</p>
        ) : null}
        {includesEnrollmentFee && action === "scholarship" ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {d.includesEnrollmentFeeScholarshipNote}
          </p>
        ) : null}
        {includesEnrollmentFee && action === "exempt" ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{d.includesEnrollmentFeeExemptNote}</p>
        ) : null}

        {action === "scholarship" ? (
          <div className="space-y-3">
            <ScholarshipDiscountFields
              idPrefix="cell-scholarship"
              locale={locale}
              currency={referenceMonthlyCurrency}
              referenceMonthlyAmount={referenceMonthlyAmount}
              labels={billingLabels}
              disabled={busy}
              minPercent={1}
              onResolvedPercentChange={setResolvedPercent}
            />
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

        {action === "revert" ? (
          <div className="space-y-1">
            <Label htmlFor="revert-note">{d.revertNoteLabel}</Label>
            <Input
              id="revert-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={d.revertNotePlaceholder}
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
            variant={action === "revert" ? "secondary" : "primary"}
            onClick={handleConfirm}
            disabled={!canConfirm || busy}
            isLoading={busy}
          >
            {action === "revert" ? (
              <Undo2 className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Check className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {action === "revert" ? d.confirmRevert : d.confirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
