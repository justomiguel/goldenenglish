"use client";

import { useRef, useState } from "react";
import { CheckCircle, Clock, XCircle, Upload, ExternalLink } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";
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
  submitAction,
  onSubmitted,
}: StudentEnrollmentFeeUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canUpload = receiptStatus !== "approved";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    setSuccess(false);

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
    if (fileRef.current) fileRef.current.value = "";
    onSubmitted?.();
  }

  return (
    <div className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-3">
      <p className="text-sm font-semibold text-[var(--color-foreground)]">
        {labels.enrollmentFeeUploadTitle}
      </p>
      <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
        {labels.enrollmentFeeUploadLead}
      </p>

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
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-3">
          <label className="block text-xs text-[var(--color-muted-foreground)]">
            {labels.enrollmentFeeUploadNote}
          </label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              name="receipt"
              accept="image/*,application/pdf"
              required
              disabled={busy}
              className="min-w-0 flex-1 text-xs text-[var(--color-foreground)] file:mr-2 file:rounded file:border-0 file:bg-[var(--color-primary)] file:px-2 file:py-1 file:text-xs file:font-medium file:text-[var(--color-primary-foreground)]"
            />
            <Button
              type="submit"
              disabled={busy}
              isLoading={busy}
              size="sm"
              className="min-h-[36px] shrink-0"
            >
              <Upload className="mr-1 h-3.5 w-3.5" aria-hidden />
              {receiptStatus === "rejected"
                ? labels.enrollmentFeeReuploadBtn
                : labels.enrollmentFeeUploadBtn}
            </Button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-[var(--color-error)]" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
