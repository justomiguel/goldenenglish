"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  markEnrollmentFeePaidNow,
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
  labels: BillingLabels;
  initialExempt: boolean;
  initialReason: string | null;
  initialLastPaidAt: string | null;
}

export function AdminEnrollmentFeeExemption({
  locale,
  studentId,
  labels,
  initialExempt,
  initialReason,
  initialLastPaidAt,
}: AdminEnrollmentFeeExemptionProps) {
  const router = useRouter();
  const [exempt, setExempt] = useState(initialExempt);
  const [reason, setReason] = useState(initialReason ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function saveExemption(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await setEnrollmentFeeExemption({
      locale,
      studentId,
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
    const res = await markEnrollmentFeePaidNow({ locale, studentId });
    setBusy(false);
    setMsg(res.ok ? labels.saved : res.message ?? labels.error);
    if (res.ok) router.refresh();
  }

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="font-semibold text-[var(--color-secondary)]">{labels.enrollmentFeeTitle}</h2>
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

      {msg ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]" role="status">
          {msg}
        </p>
      ) : null}
    </section>
  );
}
