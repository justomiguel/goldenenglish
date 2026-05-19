"use client";

import { useState } from "react";
import { CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react";
import { ReceiptAutoUploadField } from "@/components/molecules/ReceiptAutoUploadField";
import type { Dictionary } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { EnrollmentFeeReceiptStatus } from "@/types/studentMonthlyPayments";

type MonthlyLabels = Dictionary["dashboard"]["student"]["monthly"];

export type SubmitEnrollmentFeeReceiptAction = (
  formData: FormData,
) => Promise<{ ok: boolean; message?: string }>;

interface StudentEnrollmentFeeUploadProps {
  locale: string;
  studentId: string;
  sectionId: string;
  enrollmentId: string;
  receiptStatus: EnrollmentFeeReceiptStatus | null;
  receiptSignedUrl: string | null;
  labels: MonthlyLabels;
  fileUploadProgress: FileUploadProgressLabels;
  submitAction: SubmitEnrollmentFeeReceiptAction;
  onSubmitted?: () => void;
}

export function StudentEnrollmentFeeUpload({
  locale,
  studentId,
  sectionId,
  enrollmentId,
  receiptStatus,
  receiptSignedUrl,
  labels,
  fileUploadProgress,
  submitAction,
  onSubmitted,
}: StudentEnrollmentFeeUploadProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastFileName, setLastFileName] = useState<string | null>(null);

  const canUpload = receiptStatus !== "approved";

  const showUploadLead =
    receiptStatus === null || receiptStatus === "rejected";

  const uploadButtonLabel =
    receiptStatus === "rejected"
      ? labels.enrollmentFeeReuploadBtn
      : labels.enrollmentFeeUploadBtn;

  async function uploadReceipt(file: File) {
    setBusy(true);
    setError(null);
    setSuccess(false);
    setLastFileName(file.name);

    const fd = new FormData();
    fd.append("locale", locale);
    fd.append("studentId", studentId);
    fd.append("sectionId", sectionId);
    fd.append("enrollmentId", enrollmentId);
    fd.append("receipt", file);

    const res = await submitAction(fd);
    setBusy(false);

    if (!res.ok) {
      setError(res.message ?? labels.enrollmentFeeUploadBtn);
      return;
    }
    setSuccess(true);
    onSubmitted?.();
  }

  return (
    <div className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-3">
      <p className="text-sm font-semibold text-[var(--color-foreground)]">
        {labels.enrollmentFeeUploadTitle}
      </p>
      {showUploadLead ? (
        <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
          {labels.enrollmentFeeUploadLead}
        </p>
      ) : null}

      {receiptStatus === "approved" && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-success)]">
          <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
          {labels.enrollmentFeeReceiptApproved}
        </div>
      )}

      {receiptStatus === "pending" && !success && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm text-[var(--color-warning)]">
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            {labels.enrollmentFeeReceiptPending}
          </span>
          {receiptSignedUrl && (
            <a
              href={receiptSignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] underline underline-offset-2"
            >
              {labels.enrollmentFeeReceiptView}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </div>
      )}

      {receiptStatus === "rejected" && !success && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-error)]">
          <XCircle className="h-4 w-4 shrink-0" aria-hidden />
          {labels.enrollmentFeeReceiptRejected}
        </div>
      )}

      {success && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-success)]">
          <Clock className="h-4 w-4 shrink-0" aria-hidden />
          {labels.enrollmentFeeReceiptPending}
        </div>
      )}

      {canUpload && !success && (
        <div className="mt-3">
          <p className="text-xs text-[var(--color-muted-foreground)]">{labels.enrollmentFeeUploadNote}</p>
          <ReceiptAutoUploadField
            className="mt-1.5"
            buttonLabel={uploadButtonLabel}
            inputAriaLabel={uploadButtonLabel}
            disabled={busy}
            busy={busy}
            selectedFileName={lastFileName}
            fileUploadProgress={fileUploadProgress}
            onFileSelected={uploadReceipt}
          />
          {error ? (
            <p className="mt-2 text-xs text-[var(--color-error)]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
