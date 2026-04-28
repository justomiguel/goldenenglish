"use client";

import { BookOpen } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { AdminBillingMonthMatrixLegendStrip } from "@/components/dashboard/AdminBillingMonthMatrixLegendStrip";

export interface AdminBillingMatrixLegendModalLabels {
  openButton: string;
  modalTitle: string;
  matrixLegend: string;
  cancelLabel: string;
  statusPaid: string;
  statusPending: string;
  statusRejected: string;
  statusExempt: string;
  statusUnpaid: string;
  statusOverdue: string;
  statusNoPlan: string;
  statusOutOfPeriod: string;
  matrixLegendScholarshipSample: string;
}

interface AdminBillingMatrixLegendModalProps {
  labels: AdminBillingMatrixLegendModalLabels;
}

export function AdminBillingMatrixLegendModal({ labels }: AdminBillingMatrixLegendModalProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const legendParagraphId = useId();

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="min-h-[36px]"
        onClick={() => setOpen(true)}
      >
        <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
        {labels.openButton}
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        titleId={titleId}
        descriptionId={legendParagraphId}
        title={labels.modalTitle}
        closeLabel={labels.cancelLabel}
        scrollableBody
        dialogClassName="max-w-lg"
      >
        <p
          id={legendParagraphId}
          className="text-sm leading-snug text-[var(--color-muted-foreground)]"
        >
          {labels.matrixLegend}
        </p>
        <AdminBillingMonthMatrixLegendStrip
          labelledById={legendParagraphId}
          labels={{
            statusPaid: labels.statusPaid,
            statusPending: labels.statusPending,
            statusRejected: labels.statusRejected,
            statusExempt: labels.statusExempt,
            statusUnpaid: labels.statusUnpaid,
            statusOverdue: labels.statusOverdue,
            statusNoPlan: labels.statusNoPlan,
            statusOutOfPeriod: labels.statusOutOfPeriod,
            scholarshipSample: labels.matrixLegendScholarshipSample,
          }}
        />
      </Modal>
    </>
  );
}
