"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, Save } from "lucide-react";
import {
  markEnrollmentFeePaidNow,
  reviewEnrollmentFeeReceipt,
  setEnrollmentFeeExemption,
} from "@/app/[locale]/dashboard/admin/users/[userId]/billing/enrollmentFeeActions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { AdminEnrollmentFeeReceiptPanel } from "@/components/dashboard/AdminEnrollmentFeeReceiptPanel";
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
  /** When true, show enrollment status read-only (manage via monthly matrix area workflows elsewhere). */
  readOnly?: boolean;
  /** Opened inside billing matrix modal: no outer card chrome; heading/lead come from the modal shell. */
  embeddedInModal?: boolean;
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
  readOnly = false,
  embeddedInModal = false,
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

  const shellClass = embeddedInModal
    ? "space-y-4"
    : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4";
  const ShellTag = embeddedInModal ? "div" : "section";

  return (
    <ShellTag className={shellClass}>
      {!embeddedInModal ? (
        <>
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
        </>
      ) : sectionName && initialExempt ? (
        <div className="flex flex-wrap justify-end">
          <span className="rounded-full border border-[var(--color-info)]/40 bg-[var(--color-info)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-info)]">
            {labels.enrollmentExemptInSection.replace("{section}", sectionName)}
          </span>
        </div>
      ) : null}

      {readOnly ? (
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold text-[var(--color-foreground)]">
              {labels.enrollmentExemptLabel}
            </dt>
            <dd className="text-[var(--color-muted-foreground)]">
              {initialExempt ? labels.enrollmentReadOnlyExemptYes : labels.enrollmentReadOnlyExemptNo}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-foreground)]">{labels.enrollmentReason}</dt>
            <dd className="mt-0.5 text-[var(--color-muted-foreground)]">
              {initialReason?.trim() ? initialReason : labels.emptyValue}
            </dd>
          </div>
        </dl>
      ) : (
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
            {busy ? null : <Save className="h-4 w-4 shrink-0" aria-hidden />}
            {labels.enrollmentSave}
          </Button>
        </form>
      )}

      <div className="mt-6 border-t border-[var(--color-border)] pt-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {labels.enrollmentLastPaid}:{" "}
          {initialLastPaidAt
            ? new Date(initialLastPaidAt).toLocaleDateString()
            : labels.enrollmentNonePaid}
        </p>
        {!readOnly ? (
          <Button
            type="button"
            variant="ghost"
            className="mt-2 min-h-[44px]"
            disabled={busy}
            onClick={() => void markPaid()}
          >
            <Banknote className="h-4 w-4 shrink-0" aria-hidden />
            {labels.enrollmentMarkPaid}
          </Button>
        ) : null}
      </div>

      <AdminEnrollmentFeeReceiptPanel
        labels={labels}
        receiptSignedUrl={receiptSignedUrl}
        receiptStatus={receiptStatus}
        enrollmentId={enrollmentId}
        busy={busy}
        readOnly={readOnly}
        onReview={(decision) => void reviewReceipt(decision)}
      />

      {msg ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]" role="status">
          {msg}
        </p>
      ) : null}
    </ShellTag>
  );
}
