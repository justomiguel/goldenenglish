"use client";

import { useId } from "react";
import { Modal } from "@/components/atoms/Modal";
import { AdminEnrollmentFeeExemption } from "@/components/dashboard/AdminEnrollmentFeeExemption";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminRecordPaymentEnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  studentId: string;
  sectionId: string;
  sectionName: string;
  enrollmentId: string | null;
  labels: BillingLabels;
  enrollmentFeeExempt: boolean;
  enrollmentExemptReason: string | null;
  lastEnrollmentPaidAt: string | null;
  receiptSignedUrl: string | null;
  receiptStatus: "pending" | "approved" | "rejected" | null;
}

export function AdminRecordPaymentEnrollmentModal({
  open,
  onOpenChange,
  locale,
  studentId,
  sectionId,
  sectionName,
  enrollmentId,
  labels,
  enrollmentFeeExempt,
  enrollmentExemptReason,
  lastEnrollmentPaidAt,
  receiptSignedUrl,
  receiptStatus,
}: AdminRecordPaymentEnrollmentModalProps) {
  const titleId = useId();
  const descId = useId();

  const title = labels.recordPaymentEnrollmentModalTitle.replace("{section}", sectionName);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      descriptionId={descId}
      title={title}
      closeLabel={labels.cancel}
      scrollableBody
      dialogClassName="max-w-lg"
    >
      <p id={descId} className="text-sm text-[var(--color-muted-foreground)]">
        {labels.enrollmentFeeLead}
      </p>
      <AdminEnrollmentFeeExemption
        key={`${sectionId}-${enrollmentFeeExempt}-${lastEnrollmentPaidAt ?? ""}-${receiptStatus ?? ""}`}
        embeddedInModal
        locale={locale}
        studentId={studentId}
        enrollmentId={enrollmentId}
        sectionId={sectionId}
        sectionName={sectionName}
        labels={labels}
        initialExempt={enrollmentFeeExempt}
        initialReason={enrollmentExemptReason}
        initialLastPaidAt={lastEnrollmentPaidAt}
        receiptSignedUrl={receiptSignedUrl}
        receiptStatus={receiptStatus}
        readOnly={false}
      />
    </Modal>
  );
}
