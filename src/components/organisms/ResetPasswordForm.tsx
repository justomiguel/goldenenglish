"use client";

import { useState } from "react";
import Link from "next/link";
import { useResetPassword } from "@/hooks/useResetPassword";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

interface ResetPasswordFormProps {
  labels: Dictionary["resetPassword"];
  locale: string;
}

export function ResetPasswordForm({ labels, locale }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    password,
    confirm,
    error,
    isLoading,
    success,
    linkStatus,
    setPassword,
    setConfirm,
    handleSubmit,
  } = useResetPassword({ locale, errors: labels.errors });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSubmit();
  }

  if (linkStatus === "verifying") {
    return (
      <div
        className="w-full space-y-4 text-left"
        role="status"
        aria-live="polite"
      >
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">
          {labels.kicker}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-primary)] sm:text-[2rem] sm:leading-tight">
          {labels.title}
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {labels.verifyingLink}
        </p>
      </div>
    );
  }

  if (linkStatus === "invalid") {
    return (
      <div className="w-full space-y-6 text-left">
        <div className="space-y-3">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">
            {labels.kicker}
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-primary)] sm:text-[2rem] sm:leading-tight">
            {labels.title}
          </h1>
          <div
            role="alert"
            className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_9%,var(--color-surface))] px-4 py-3 text-sm text-[var(--color-error)]"
          >
            {error ?? labels.errors.expiredLink}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/${locale}/forgot-password`}
            className="inline-flex w-full items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-base font-medium text-[var(--color-primary-foreground)] transition hover:brightness-[1.03] sm:w-auto"
          >
            {labels.requestNewLink}
          </Link>
          <Link
            href={`/${locale}/login`}
            className="inline-flex w-full items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-base font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)] sm:w-auto"
          >
            {labels.backToLogin}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full space-y-4 text-left">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">
          {labels.kicker}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-primary)] sm:text-[2rem] sm:leading-tight">
          {labels.successTitle}
        </h1>
        <p
          role="status"
          aria-live="polite"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/30 bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))] px-4 py-3 text-sm font-medium text-[var(--color-primary)]"
        >
          {labels.successBody}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full space-y-7">
      <div className="space-y-3 text-left">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">
          {labels.kicker}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-primary)] sm:text-[2rem] sm:leading-tight">
          {labels.title}
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {labels.subtitle}
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_9%,var(--color-surface))] px-4 py-3 text-sm text-[var(--color-error)]"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-5">
        <FormField
          label={labels.passwordLabel}
          type={showPassword ? "text" : "password"}
          placeholder={labels.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          className="border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.75)]"
          footer={
            <div className="flex justify-end pt-1">
              <button
                type="button"
                className="rounded-sm text-sm font-medium text-[var(--color-primary)] underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                aria-label={showPassword ? labels.hidePassword : labels.showPassword}
              >
                {showPassword ? labels.hidePassword : labels.showPassword}
              </button>
            </div>
          }
        />

        <FormField
          label={labels.confirmLabel}
          type={showPassword ? "text" : "password"}
          placeholder={labels.confirmPlaceholder}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          className="border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.75)]"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full shadow-[0_8px_28px_-8px_rgb(16_58_92_/45%)] transition hover:brightness-[1.03] active:brightness-[0.98]"
      >
        {isLoading ? labels.submitting : labels.submitButton}
      </Button>

      <div className="text-left text-sm">
        <Link
          href={`/${locale}/login`}
          className="font-medium text-[var(--color-primary)] underline-offset-4 transition hover:underline"
        >
          {labels.backToLogin}
        </Link>
      </div>
    </form>
  );
}
