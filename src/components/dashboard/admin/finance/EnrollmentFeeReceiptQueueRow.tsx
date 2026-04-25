"use client";

import { useState } from "react";
import { ExternalLink, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { reviewEnrollmentFeeReceipt } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/enrollmentFeeActions";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";

type QueueDict = Dictionary["admin"]["finance"]["enrollmentFeeQueue"];

export interface EnrollmentFeeReceiptQueueRowProps {
  locale: Locale;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  sectionName: string;
  signedUrl: string | null;
  uploadedAt: string;
  dict: QueueDict;
}

export function EnrollmentFeeReceiptQueueRow({
  locale,
  enrollmentId,
  studentId,
  studentName,
  sectionName,
  signedUrl,
  uploadedAt,
  dict,
}: EnrollmentFeeReceiptQueueRowProps) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDecision(decision: "approved" | "rejected") {
    setBusy(decision === "approved" ? "approve" : "reject");
    setError(null);
    const res = await reviewEnrollmentFeeReceipt({
      locale,
      studentId,
      enrollmentId,
      decision,
    });
    setBusy(null);
    if (res.ok) {
      setDone(decision);
    } else {
      setError(res.message ?? "Error");
    }
  }

  if (done) {
    return (
      <li className="flex items-center gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
        {done === "approved" ? (
          <CheckCircle className="h-4 w-4 shrink-0 text-[var(--color-success)]" aria-hidden />
        ) : (
          <XCircle className="h-4 w-4 shrink-0 text-[var(--color-error)]" aria-hidden />
        )}
        <span>
          {done === "approved" ? dict.approvedOk : dict.rejectedOk}
          {" — "}
          <span className="font-medium text-[var(--color-foreground)]">{studentName}</span>
          {" · "}
          {sectionName}
        </span>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div className="min-w-0 space-y-0.5">
        <p className="truncate font-medium text-[var(--color-foreground)]">{studentName}</p>
        <p className="truncate text-sm text-[var(--color-muted-foreground)]">
          {dict.sectionLabel}: {sectionName}
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {dict.uploadedLabel}:{" "}
          {new Intl.DateTimeFormat(locale, {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(uploadedAt))}
        </p>
        {error ? (
          <p className="text-xs text-[var(--color-error)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {signedUrl ? (
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={dict.viewReceipt}
            className="inline-flex items-center gap-1.5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/40"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {dict.viewReceipt}
          </a>
        ) : null}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleDecision("rejected")}
          disabled={busy !== null}
          aria-label={dict.reject}
        >
          {busy === "reject" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-[var(--color-error)]" aria-hidden />
          )}
          {dict.reject}
        </Button>
        <Button
          size="sm"
          onClick={() => handleDecision("approved")}
          disabled={busy !== null}
          aria-label={dict.approve}
        >
          {busy === "approve" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <CheckCircle className="h-3.5 w-3.5" aria-hidden />
          )}
          {dict.approve}
        </Button>
      </div>
    </li>
  );
}
