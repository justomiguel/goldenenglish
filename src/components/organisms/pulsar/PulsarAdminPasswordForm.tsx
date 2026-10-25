"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, KeyRound } from "lucide-react";
import { changePulsarStaffPasswordAction } from "@/app/[locale]/admin/passwordActions";
import type { Dictionary } from "@/types/i18n";

export interface PulsarAdminPasswordFormProps {
  locale: string;
  dict: Dictionary;
}

export function PulsarAdminPasswordForm({ locale, dict }: PulsarAdminPasswordFormProps) {
  const router = useRouter();
  const copy = dict.pulsar.admin.password;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    if (password.length < 8) {
      setErrorMsg(copy.tooShort);
      return;
    }
    if (password !== confirm) {
      setErrorMsg(copy.mismatch);
      return;
    }
    setIsLoading(true);
    const result = await changePulsarStaffPasswordAction({ locale, password });
    if (!result.ok) {
      setErrorMsg(copy.errors[result.errorCode as keyof typeof copy.errors] ?? copy.errors.update_failed);
      setIsLoading(false);
      return;
    }
    router.push(`/${locale}/admin`);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-12 text-[var(--color-foreground)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-muted)] text-[var(--color-primary)]">
          <KeyRound className="h-5 w-5" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{copy.lead}</p>

        {errorMsg ? (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--color-error)] bg-[var(--color-surface)] p-3 text-xs font-medium text-[var(--color-error)]"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="pulsar-new-password"
              className="block text-xs font-semibold text-[var(--color-foreground)]"
            >
              {copy.newPasswordLabel}
            </label>
            <input
              id="pulsar-new-password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)]"
            />
          </div>
          <div>
            <label
              htmlFor="pulsar-confirm-password"
              className="block text-xs font-semibold text-[var(--color-foreground)]"
            >
              {copy.confirmPasswordLabel}
            </label>
            <input
              id="pulsar-confirm-password"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" aria-hidden />
            <span>{isLoading ? copy.submitting : copy.submit}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
