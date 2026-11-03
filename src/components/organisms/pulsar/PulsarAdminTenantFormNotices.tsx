"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

type ProbeBanner = {
  ok: boolean;
  latencyMs: number;
  errorCode: string | null;
};

export interface PulsarAdminTenantFormNoticesProps {
  probeBanner: ProbeBanner | null;
  errorText: string | null;
  savedNotice: boolean;
  testOk: string;
  testFail: string;
  savedLabel: string;
}

export function PulsarAdminTenantFormNotices({
  probeBanner,
  errorText,
  savedNotice,
  testOk,
  testFail,
  savedLabel,
}: PulsarAdminTenantFormNoticesProps) {
  return (
    <>
      {probeBanner ? (
        <div
          role="status"
          className={`mt-4 flex items-center gap-2 rounded-lg border p-3 text-xs font-semibold ${
            probeBanner.ok
              ? "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)]"
              : "border-[var(--color-error)] bg-[var(--color-surface)] text-[var(--color-error)]"
          }`}
        >
          {probeBanner.ok ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          )}
          <span>
            {probeBanner.ok
              ? `${testOk} (${probeBanner.latencyMs} ms)`
              : `${testFail} (${probeBanner.errorCode ?? "error"})`}
          </span>
        </div>
      ) : null}
      {errorText ? (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--color-error)] bg-[var(--color-surface)] p-3 text-xs font-semibold text-[var(--color-error)]"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          <span>{errorText}</span>
        </div>
      ) : null}
      {savedNotice ? (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs font-semibold text-[var(--color-primary)]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          <span>{savedLabel}</span>
        </div>
      ) : null}
    </>
  );
}
