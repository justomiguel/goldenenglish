"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  markEnrollmentFeePaidNow,
  reviewEnrollmentFeeReceipt,
  setEnrollmentFeeExemption,
} from "@/app/[locale]/dashboard/admin/users/[userId]/billing/enrollmentFeeActions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

interface AdminEnrollmentFeeExemptionProps {
  locale: Locale;
  studentId: string;
  enrollmentId: string | null;
  sectionId: string | null;
  sectionName: string | null;
  labels: BillingLabels;
  initialExempt: boolean;
  initialReason: string | null;
  initialLastPaidAt: string | null;
  receiptSignedUrl: string | null;
  receiptStatus: "pending" | "approved" | "rejected" | null;
}

export function AdminEnrollmentFeeExemption({
  locale,
  studentId,
  enrollmentId,
  sectionId,
  sectionName,
  labels,
  initialExempt,
  initialReason,
  initialLastPaidAt,
  receiptSignedUrl,
  receiptStatus: initialReceiptStatus,
}: AdminEnrollmentFeeExemptionProps) {
  const router = useRouter();
  const [exempt, setExempt] = useState(initialExempt);
  const [reason, setReason] = useState(initialReason ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [receiptStatus, setReceiptStatus] = useState(initialReceiptStatus);

  async function saveExemption(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await setEnrollmentFeeExemption({
      locale,
      studentId,
      sectionId: sectionId ?? undefined,
      exempt,
      reason: reason.trim() || undefined,
    });
    setBusy(false);
    setMsg(res.ok ? labels.saved : res.message ?? labels.error);
    if (res.ok) router.refresh();
  }

  async function markPaid() {
    setBusy(true);
    setMsg(null);
    const res = await markEnrollmentFeePaidNow({
      locale,
      studentId,
      sectionId: sectionId ?? undefined,
    });
    setBusy(false);
    setMsg(res.ok ? labels.saved : res.message ?? labels.error);
    if (res.ok) router.refresh();
  }

  async function reviewReceipt(decision: "approved" | "rejected") {
    if (!enrollmentId) return;
    setBusy(true);
    setMsg(null);
    const res = await reviewEnrollmentFeeReceipt({
      locale,
      studentId,
      enrollmentId,
      decision,
    });
    setBusy(false);
    setMsg(res.ok ? labels.saved : res.message ?? labels.error);
    if (res.ok) {
      setReceiptStatus(decision);
      router.refresh();
    }
  }

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-[var(--color-secondary)]">{labels.enrollmentFeeTitle}</h2>
          {sectionName ? (
            <p className="mt-1 text-sm font-medium text-[var(--color-foreground)]">
              {labels.enrollmentSection.replace("{section}", sectionName)}
            </p>
          ) : null}
        </div>
        {sectionName && initialExempt ? (
          <span className="rounded-full border border-[var(--color-info)]/40 bg-[var(--color-info)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-info)]">
            {labels.enrollmentExemptInSection.replace("{section}", sectionName)}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.enrollmentFeeLead}</p>

      <form onSubmit={saveExemption} className="mt-4 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={exempt}
            onChange={(e) => setExempt(e.target.checked)}
            disabled={busy}
          />
          {labels.enrollmentExemptLabel}
        </label>
        <div>
          <Label htmlFor="enr-reason">{labels.enrollmentReason}</Label>
          <Input
            id="enr-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1"
            disabled={busy}
          />
        </div>
        <Button type="submit" disabled={busy} isLoading={busy} className="min-h-[44px]">
          {labels.enrollmentSave}
        </Button>
      </form>

      <div className="mt-6 border-t border-[var(--color-border)] pt-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {labels.enrollmentLastPaid}:{" "}
          {initialLastPaidAt
            ? new Date(initialLastPaidAt).toLocaleDateString()
            : labels.enrollmentNonePaid}
        </p>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 min-h-[44px]"
          disabled={busy}
          onClick={() => void markPaid()}
        >
          {labels.enrollmentMarkPaid}
        </Button>
      </div>

      {receiptSignedUrl || receiptStatus ? (
        <div className="mt-6 border-t border-[var(--color-border)] pt-4 space-y-2">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            {labels.enrollmentReceiptTitle}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {receiptStatus === "pending" && (
              <span className="flex items-center gap-1 text-sm text-[var(--color-warning)]">
                <Clock className="h-4 w-4" aria-hidden />
                {labels.enrollmentReceiptPending}
              </span>
            )}
            {receiptStatus === "approved" && (
              <span className="flex items-center gap-1 text-sm text-[var(--color-success)]">
                <CheckCircle className="h-4 w-4" aria-hidden />
                {labels.enrollmentReceiptApproved}
              </span>
            )}
            {receiptStatus === "rejected" && (
              <span className="flex items-center gap-1 text-sm text-[var(--color-error)]">
                <XCircle className="h-4 w-4" aria-hidden />
                {labels.enrollmentReceiptRejected}
              </span>
            )}
            {receiptSignedUrl && (
              <a
                href={receiptSignedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] underline underline-offset-2"
              >
                {labels.enrollmentReceiptView}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            )}
          </div>
          {receiptStatus !== "approved" && enrollmentId && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-[36px]"
                disabled={busy}
                onClick={() => void reviewReceipt("approved")}
              >
                {labels.enrollmentReceiptApprove}
              </Button>
              {receiptStatus !== "rejected" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-[36px] border-[var(--color-error)] text-[var(--color-error)]"
                  disabled={busy}
                  onClick={() => void reviewReceipt("rejected")}
                >
                  {labels.enrollmentReceiptReject}
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 border-t border-[var(--color-border)] pt-4">
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.enrollmentReceiptNone}</p>
        </div>
      )}

      {msg ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]" role="status">
          {msg}
        </p>
      ) : null}
    </section>
  );
}
